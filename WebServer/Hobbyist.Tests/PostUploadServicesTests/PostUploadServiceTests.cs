using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Services.MediaStorageServices.ObjectStoreServices;
using Hobbyist.Api.Services.MediaStorageServices.UrlSignerServices;
using Hobbyist.Api.Services.PostServices;
using Hobbyist.Api.Services.PostServices.PostUploadServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests.PostUploadServicesTests;

/// <summary>
/// Covers the two-state upload lifecycle: a post is always born Draft at init, the bytes go
/// straight to storage, and finalize verifies them — publishing only when the caller asks and
/// every file has landed.
/// </summary>
[TestFixture]
public class PostUploadServiceTests : DatabaseTestBase
{
    private const long DefaultByteSize = 1000;

    private PostUploadService _service = null!;
    private Mock<IMediaUrlSignerService> _urlSignerMock = null!;
    private Mock<IMediaObjectStoreService> _objectStoreMock = null!;
    private Guid _userId;

    // Object key -> stored object metadata, consulted by the GetObjectInfoAsync mock. SetupStorage
    // populates it per test to model which uploads have (or haven't) landed.
    private readonly Dictionary<string, MediaObjectInfo> _storage = new();

    protected override async Task OnSetUpAsync()
    {
        _storage.Clear();

        _urlSignerMock = new Mock<IMediaUrlSignerService>();
        _urlSignerMock
            .Setup(s =>
                s.CreateUploadUrlAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<TimeSpan?>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(
                (string key, string contentType, TimeSpan? _, CancellationToken _) =>
                    Result<PresignedPut>.Success(
                        new PresignedPut
                        {
                            Url = $"https://storage.test/{key}",
                            RequiredHeaders = new Dictionary<string, string>
                            {
                                ["Content-Type"] = contentType,
                            },
                            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15),
                        }
                    )
            );

        _objectStoreMock = new Mock<IMediaObjectStoreService>();
        _objectStoreMock
            .Setup(s => s.GetObjectInfoAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (string key, CancellationToken _) =>
                    Result<MediaObjectInfo>.Success(
                        _storage.TryGetValue(key, out var info)
                            ? info
                            : new MediaObjectInfo { Exists = false, ContentLength = 0 }
                    )
            );
        _objectStoreMock
            .Setup(s => s.DeleteByPrefixAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.NoContent());

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["PostMedia:AllowedContentTypes:0"] = "image/jpeg",
                    ["PostMedia:AllowedContentTypes:1"] = "image/png",
                    ["PostMedia:AllowedContentTypes:2"] = "video/mp4",
                }
            )
            .Build();

        _service = new PostUploadService(
            _urlSignerMock.Object,
            _objectStoreMock.Object,
            Context,
            configuration,
            NullLogger<PostUploadService>.Instance
        );

        // A real user is required to satisfy the Posts.UserId foreign key.
        _userId = Guid.NewGuid();
        Context.Users.Add(
            new UserEntity
            {
                Id = _userId,
                Username = "tester",
                Email = "tester@example.com",
                PasswordHash = "hash",
                Firstname = "Test",
                Lastname = "User",
                DateOfBirth = new DateOnly(1990, 1, 1),
                CreatedAt = DateTimeOffset.UtcNow,
            }
        );
        await Context.SaveChangesAsync();
    }

    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------

    private string UserId => _userId.ToString();

    private static InitPostRequest BuildRequest(int mediaCount = 1, bool completeMetadata = true)
    {
        var media = Enumerable
            .Range(1, mediaCount)
            .Select(position => new MediaManifestItem
            {
                Position = position,
                FileName = $"file{position}.jpg",
                ContentType = "image/jpeg",
                ByteSize = DefaultByteSize,
            })
            .ToArray();

        return new InitPostRequest
        {
            Hobby = completeMetadata ? "Trading Cards" : null,
            Title = completeMetadata ? "My Hobby Item" : null,
            Description = completeMetadata ? "A detailed description." : null,
            AvailableForTrade = false,
            LookingFor = null,
            Media = media,
        };
    }

    private async Task<string> InitPostAsync(int mediaCount = 1, bool completeMetadata = true)
    {
        var result = await _service.InitAsync(
            BuildRequest(mediaCount, completeMetadata),
            UserId,
            CancellationToken.None
        );
        Assert.That(result.IsSuccess, Is.True, "init should succeed");
        return result.Content!.Slug;
    }

    /// <summary>
    /// Tells the object-store mock which of a post's media have landed. Present files report a
    /// matching byte size; positions left out report as missing. <paramref name="corruptPositions"/>
    /// report present but with a mismatched size.
    /// </summary>
    private async Task SetupStorageAsync(
        string slug,
        IEnumerable<int> presentPositions,
        IEnumerable<int>? corruptPositions = null
    )
    {
        var present = presentPositions.ToHashSet();
        var corrupt = (corruptPositions ?? []).ToHashSet();

        var media = await Context
            .Posts.Where(p => p.Id == slug)
            .SelectMany(p => p.Media)
            .ToListAsync();

        foreach (var m in media)
        {
            var key = MediaObjectKeys.BuildObjectKey(UserId, slug, m.Id, m.FileExtension);
            if (corrupt.Contains(m.Position))
                _storage[key] = new MediaObjectInfo { Exists = true, ContentLength = m.ByteSize + 1 };
            else if (present.Contains(m.Position))
                _storage[key] = new MediaObjectInfo { Exists = true, ContentLength = m.ByteSize };
        }
    }

    private Task<PostEntity?> ReloadPostAsync(string slug)
    {
        Context.ChangeTracker.Clear();
        return Context.Posts.Include(p => p.Media).FirstOrDefaultAsync(p => p.Id == slug);
    }

    // ------------------------------------------------------------------------
    // InitAsync
    // ------------------------------------------------------------------------

    #region InitAsync

    [Test]
    public async Task InitAsync_CreatesDraftWithPendingMedia()
    {
        var result = await _service.InitAsync(BuildRequest(2), UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);

        var post = await ReloadPostAsync(result.Content!.Slug);
        Assert.That(post, Is.Not.Null);
        Assert.That(post!.Status, Is.EqualTo(PostStatus.Draft));
        Assert.That(post.Media, Has.Count.EqualTo(2));
        Assert.That(post.Media.All(m => m.Status == PostMediaStatus.Pending), Is.True);
    }

    [Test]
    public async Task InitAsync_ReturnsAnUploadPerManifestItem()
    {
        var result = await _service.InitAsync(BuildRequest(3), UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!.Uploads, Has.Length.EqualTo(3));
        Assert.That(
            result.Content.Uploads.Select(u => u.Position),
            Is.EquivalentTo(new[] { 1, 2, 3 })
        );
    }

    [Test]
    public async Task InitAsync_AllowsIncompleteMetadata()
    {
        var result = await _service.InitAsync(
            BuildRequest(completeMetadata: false),
            UserId,
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);
        var post = await ReloadPostAsync(result.Content!.Slug);
        Assert.That(post!.Status, Is.EqualTo(PostStatus.Draft));
        Assert.That(post.Hobby, Is.Null);
    }

    [Test]
    public async Task InitAsync_WithEmptyManifest_ReturnsBadRequest()
    {
        var request = BuildRequest();
        request.Media = [];

        var result = await _service.InitAsync(request, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task InitAsync_WithTooManyFiles_ReturnsBadRequest()
    {
        var result = await _service.InitAsync(BuildRequest(16), UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task InitAsync_WithDuplicatePositions_ReturnsBadRequest()
    {
        var request = BuildRequest(2);
        request.Media[1].Position = 1;

        var result = await _service.InitAsync(request, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task InitAsync_WithUnsupportedContentType_ReturnsBadRequest()
    {
        var request = BuildRequest();
        request.Media[0].ContentType = "application/zip";

        var result = await _service.InitAsync(request, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task InitAsync_WithOversizedFile_ReturnsBadRequest()
    {
        var request = BuildRequest();
        request.Media[0].ByteSize = PostMediaConfig.MaxFileSizeBytes + 1;

        var result = await _service.InitAsync(request, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task InitAsync_WithInvalidUserId_ReturnsBadRequest()
    {
        var result = await _service.InitAsync(BuildRequest(), "not-a-guid", CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    #endregion

    // ------------------------------------------------------------------------
    // FinalizeAsync
    // ------------------------------------------------------------------------

    #region FinalizeAsync

    [Test]
    public async Task FinalizeAsync_Publish_WhenAllUploaded_PublishesPost()
    {
        var slug = await InitPostAsync(2);
        await SetupStorageAsync(slug, presentPositions: [1, 2]);

        var result = await _service.FinalizeAsync(slug, publish: true, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!.Published, Is.True);
        Assert.That(result.Content.PendingUploads, Is.Empty);

        var post = await ReloadPostAsync(slug);
        Assert.That(post!.Status, Is.EqualTo(PostStatus.Published));
        Assert.That(post.PublishedAt, Is.Not.Null);
        Assert.That(post.Media.All(m => m.Status == PostMediaStatus.Uploaded), Is.True);
    }

    [Test]
    public async Task FinalizeAsync_Publish_WhenIncomplete_StaysDraftAndReportsPending()
    {
        var slug = await InitPostAsync(2);
        await SetupStorageAsync(slug, presentPositions: [1]); // position 2 missing

        var result = await _service.FinalizeAsync(slug, publish: true, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!.Published, Is.False);
        Assert.That(
            result.Content.PendingUploads.Select(u => u.Position),
            Is.EquivalentTo(new[] { 2 })
        );
        // The pending position comes back with a fresh, actionable upload target.
        Assert.That(result.Content.PendingUploads[0].Url, Is.Not.Empty);

        var post = await ReloadPostAsync(slug);
        Assert.That(post!.Status, Is.EqualTo(PostStatus.Draft));
        Assert.That(post.PublishedAt, Is.Null);
    }

    [Test]
    public async Task FinalizeAsync_Publish_WhenMetadataIncomplete_ReturnsBadRequest()
    {
        var slug = await InitPostAsync(1, completeMetadata: false);
        await SetupStorageAsync(slug, presentPositions: [1]);

        var result = await _service.FinalizeAsync(slug, publish: true, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));

        var post = await ReloadPostAsync(slug);
        Assert.That(post!.Status, Is.EqualTo(PostStatus.Draft));
    }

    [Test]
    public async Task FinalizeAsync_Draft_WhenAllUploaded_VerifiesAndStaysDraft()
    {
        var slug = await InitPostAsync(2);
        await SetupStorageAsync(slug, presentPositions: [1, 2]);

        var result = await _service.FinalizeAsync(
            slug,
            publish: false,
            UserId,
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!.Published, Is.False);
        Assert.That(result.Content.PendingUploads, Is.Empty);

        var post = await ReloadPostAsync(slug);
        Assert.That(post!.Status, Is.EqualTo(PostStatus.Draft));
        Assert.That(post.PublishedAt, Is.Null);
        Assert.That(post.Media.All(m => m.Status == PostMediaStatus.Uploaded), Is.True);
    }

    [Test]
    public async Task FinalizeAsync_Draft_WhenIncomplete_ReportsPending()
    {
        var slug = await InitPostAsync(2);
        await SetupStorageAsync(slug, presentPositions: [2]); // position 1 missing

        var result = await _service.FinalizeAsync(
            slug,
            publish: false,
            UserId,
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(
            result.Content!.PendingUploads.Select(u => u.Position),
            Is.EquivalentTo(new[] { 1 })
        );

        var post = await ReloadPostAsync(slug);
        Assert.That(post!.Status, Is.EqualTo(PostStatus.Draft));
    }

    [Test]
    public async Task FinalizeAsync_WhenByteSizeMismatches_CountsAsPending()
    {
        var slug = await InitPostAsync(1);
        await SetupStorageAsync(slug, presentPositions: [], corruptPositions: [1]);

        var result = await _service.FinalizeAsync(slug, publish: true, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!.Published, Is.False);
        Assert.That(
            result.Content.PendingUploads.Select(u => u.Position),
            Is.EquivalentTo(new[] { 1 })
        );
    }

    [Test]
    public async Task FinalizeAsync_AcrossCalls_KeepsLandedFilesAndResignsOnlyMissing()
    {
        var slug = await InitPostAsync(2);
        await SetupStorageAsync(slug, presentPositions: [1]); // position 2 missing

        var first = await _service.FinalizeAsync(slug, publish: true, UserId, CancellationToken.None);
        Assert.That(first.Content!.Published, Is.False);
        Assert.That(
            first.Content.PendingUploads.Select(u => u.Position),
            Is.EquivalentTo(new[] { 2 })
        );

        // The client uploads the missing file and finalizes again; position 1 stays Uploaded.
        await SetupStorageAsync(slug, presentPositions: [1, 2]);
        var second = await _service.FinalizeAsync(slug, publish: true, UserId, CancellationToken.None);

        Assert.That(second.Content!.Published, Is.True);
        Assert.That(second.Content.PendingUploads, Is.Empty);

        var post = await ReloadPostAsync(slug);
        Assert.That(post!.Media.All(m => m.Status == PostMediaStatus.Uploaded), Is.True);
    }

    [Test]
    public async Task FinalizeAsync_WhenAlreadyPublished_IsIdempotent()
    {
        var slug = await InitPostAsync(1);
        await SetupStorageAsync(slug, presentPositions: [1]);
        await _service.FinalizeAsync(slug, publish: true, UserId, CancellationToken.None);

        // Second finalize on a live post — even a draft-intent one — succeeds without changes.
        var result = await _service.FinalizeAsync(
            slug,
            publish: false,
            UserId,
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!.Published, Is.True);
        Assert.That(result.Content.PendingUploads, Is.Empty);

        var post = await ReloadPostAsync(slug);
        Assert.That(post!.Status, Is.EqualTo(PostStatus.Published));
    }

    [Test]
    public async Task FinalizeAsync_WhenPostMissing_ReturnsNotFound()
    {
        var result = await _service.FinalizeAsync(
            "does-not-exist",
            publish: true,
            UserId,
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task FinalizeAsync_WhenNotOwned_ReturnsNotFound()
    {
        var slug = await InitPostAsync(1);

        var result = await _service.FinalizeAsync(
            slug,
            publish: true,
            Guid.NewGuid().ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task FinalizeAsync_WithInvalidUserId_ReturnsBadRequest()
    {
        var result = await _service.FinalizeAsync(
            "any-slug",
            publish: true,
            "not-a-guid",
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    #endregion

    // ------------------------------------------------------------------------
    // DiscardAsync
    // ------------------------------------------------------------------------

    #region DiscardAsync

    [Test]
    public async Task DiscardAsync_RemovesDraftAndDeletesStorage()
    {
        var slug = await InitPostAsync(2);

        var result = await _service.DiscardAsync(slug, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        var post = await ReloadPostAsync(slug);
        Assert.That(post, Is.Null);
        _objectStoreMock.Verify(
            s => s.DeleteByPrefixAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Test]
    public async Task DiscardAsync_WhenPublished_ReturnsBadRequest()
    {
        var slug = await InitPostAsync(1);
        await SetupStorageAsync(slug, presentPositions: [1]);
        await _service.FinalizeAsync(slug, publish: true, UserId, CancellationToken.None);

        var result = await _service.DiscardAsync(slug, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        Assert.That(await ReloadPostAsync(slug), Is.Not.Null);
    }

    [Test]
    public async Task DiscardAsync_WhenMissing_ReturnsNotFound()
    {
        var result = await _service.DiscardAsync(
            "does-not-exist",
            UserId,
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task DiscardAsync_WhenStorageDeleteFails_AbortsWithoutRemovingRow()
    {
        var slug = await InitPostAsync(1);
        _objectStoreMock
            .Setup(s => s.DeleteByPrefixAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.InternalServerError("storage down"));

        var result = await _service.DiscardAsync(slug, UserId, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
        Assert.That(await ReloadPostAsync(slug), Is.Not.Null, "the row must survive a storage failure");
    }

    [Test]
    public async Task DiscardAsync_WithInvalidUserId_ReturnsBadRequest()
    {
        var result = await _service.DiscardAsync("any-slug", "not-a-guid", CancellationToken.None);

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    #endregion
}
