using System.Text;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Services.MediaStorageServices;
using Hobbyist.Api.Services.PostServices.PostDraftServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests;

[TestFixture]
public class PostDraftServiceTests : DatabaseTestBase
{
    private Mock<IMediaStorageService> _storage = null!;
    private PostDraftService _service = null!;

    // A seeded user available to every test that needs a valid FK.
    private UserEntity _user = null!;

    protected override async Task SeedTestClassDataAsync()
    {
        _user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Username = $"draft-user-{Guid.NewGuid():N}",
            Email = $"draft-{Guid.NewGuid():N}@example.com",
            PasswordHash = "hash",
            Firstname = "Draft",
            Lastname = "User",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTimeOffset.UtcNow,
        };
        Context.Users.Add(_user);
        await Context.SaveChangesAsync();
    }

    protected override Task OnSetUpAsync()
    {
        _storage = new Mock<IMediaStorageService>(MockBehavior.Strict);
        _service = new PostDraftService(
            _storage.Object,
            Context,
            NullLogger<PostDraftService>.Instance
        );
        return Task.CompletedTask;
    }

    // -------------------------------------------------------------------------
    // CreateDraftAsync
    // -------------------------------------------------------------------------

    [Test]
    public async Task CreateDraftAsync_WithNoMedia_ReturnsBadRequest()
    {
        var result = await _service.CreateDraftAsync(
            [],
            _user.Id.ToString(),
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        }
    }

    [Test]
    public async Task CreateDraftAsync_WithEmptyFile_ReturnsBadRequest()
    {
        var result = await _service.CreateDraftAsync(
            [BuildFile("photo.jpg", "image/jpeg", string.Empty)],
            _user.Id.ToString(),
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        }
    }

    [Test]
    public async Task CreateDraftAsync_WithInvalidUserId_ReturnsBadRequest()
    {
        var result = await _service.CreateDraftAsync(
            [BuildFile("photo.jpg", "image/jpeg", "data")],
            "not-a-guid",
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        }
    }

    [Test]
    public async Task CreateDraftAsync_ExceedingMaxFiles_ReturnsBadRequest()
    {
        // Build one more file than the configured maximum.
        var files = Enumerable
            .Range(0, PostDraftConfig.MaxMediaFiles + 1)
            .Select(i => BuildFile($"photo{i}.jpg", "image/jpeg", "data"))
            .ToArray();

        var result = await _service.CreateDraftAsync(
            files,
            _user.Id.ToString(),
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        }
    }

    [Test]
    public async Task CreateDraftAsync_WhenSecondUploadFails_RollsBackFirstUploadAndReturnsError()
    {
        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();

        // First upload succeeds; second fails.
        var callCount = 0;
        _storage
            .Setup(s =>
                s.UploadAsync(It.IsAny<UploadMediaRequest>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(
                (UploadMediaRequest r, CancellationToken _) =>
                {
                    callCount++;
                    return callCount == 1
                        ? Result<UploadMediaResponse>.Success(
                            new UploadMediaResponse
                            {
                                ObjectKey = r.ObjectKey,
                                ContentType = r.ContentType,
                                SizeBytes = r.ContentLength,
                            }
                        )
                        : Result<UploadMediaResponse>.InternalServerError("S3 error");
                }
            );

        _storage
            .Setup(s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.NoContent());

        var result = await _service.CreateDraftAsync(
            [BuildFile("a.jpg", "image/jpeg", "data"), BuildFile("b.jpg", "image/jpeg", "data")],
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.False);
        // The first (successful) upload must be rolled back; the second was never uploaded.
        _storage.Verify(
            s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
        Assert.That(await Context.Posts.CountAsync(), Is.Zero);
    }

    [Test]
    public async Task CreateDraftAsync_WhenDbSaveFails_RollsBackAllUploadsAndReturnsInternalServerError()
    {
        // A valid GUID that has no corresponding user row triggers the FK constraint.
        var nonExistentUserId = Guid.NewGuid().ToString();

        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        SetupUploadAlwaysSucceeds();

        _storage
            .Setup(s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.NoContent());

        var result = await _service.CreateDraftAsync(
            [BuildFile("a.jpg", "image/jpeg", "data"), BuildFile("b.jpg", "image/jpeg", "data")],
            nonExistentUserId,
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
        }
        // Both uploaded objects must be cleaned up.
        _storage.Verify(
            s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2)
        );
    }

    [Test]
    public async Task CreateDraftAsync_WhenSuccessful_ReturnsDraftWithMediaObjectKeys()
    {
        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        SetupUploadAlwaysSucceeds();

        var result = await _service.CreateDraftAsync(
            [BuildFile("a.jpg", "image/jpeg", "data"), BuildFile("b.mp4", "video/mp4", "data")],
            _user.Id.ToString(),
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content, Is.Not.Null);
            Assert.That(result.Content!.PostId, Is.Not.Empty);
            Assert.That(result.Content.MediaObjectKeys, Has.Length.EqualTo(2));
        }
    }

    [Test]
    public async Task CreateDraftAsync_WhenSuccessful_PersistsDraftWithCorrectState()
    {
        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        SetupUploadAlwaysSucceeds();

        var before = DateTimeOffset.UtcNow;

        var result = await _service.CreateDraftAsync(
            [BuildFile("a.jpg", "image/jpeg", "data"), BuildFile("b.jpg", "image/jpeg", "data")],
            _user.Id.ToString(),
            CancellationToken.None
        );

        var post = await Context.Posts.FindAsync(result.Content!.PostId);
        Assert.That(post, Is.Not.Null);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(post!.IsDraft, Is.True);
            Assert.That(post.MediaCount, Is.EqualTo(2));
            Assert.That(post.Hobby, Is.Null);
            Assert.That(post.Title, Is.Null);
            Assert.That(post.Description, Is.Null);
            Assert.That(post.ExpiresAt, Is.Not.Null);
            Assert.That(
                post.ExpiresAt!.Value,
                Is.EqualTo(before.AddDays(PostDraftConfig.DraftLifetimeDays))
                    .Within(TimeSpan.FromSeconds(5))
            );
        }
    }

    // -------------------------------------------------------------------------
    // AddMediaAsync
    // -------------------------------------------------------------------------

    [Test]
    public async Task AddMediaAsync_WhenDraftNotFound_ReturnsNotFound()
    {
        var result = await _service.AddMediaAsync(
            "nonexistentslug",
            BuildFile("a.jpg", "image/jpeg", "data"),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task AddMediaAsync_WhenPostIsNotADraft_ReturnsBadRequest()
    {
        var published = await SeedPostAsync(isDraft: false, mediaCount: 1);

        var result = await _service.AddMediaAsync(
            published.Id,
            BuildFile("a.jpg", "image/jpeg", "data"),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task AddMediaAsync_WhenPostBelongsToAnotherUser_ReturnsNotFound()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1);
        var otherUserId = Guid.NewGuid().ToString();

        var result = await _service.AddMediaAsync(
            draft.Id,
            BuildFile("a.jpg", "image/jpeg", "data"),
            otherUserId,
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task AddMediaAsync_WithEmptyFile_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1);

        var result = await _service.AddMediaAsync(
            draft.Id,
            BuildFile("a.jpg", "image/jpeg", string.Empty),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task AddMediaAsync_WhenDraftIsAtMaxFiles_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: PostDraftConfig.MaxMediaFiles);

        var result = await _service.AddMediaAsync(
            draft.Id,
            BuildFile("extra.jpg", "image/jpeg", "data"),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task AddMediaAsync_WhenUploadFails_LeavesMediaCountUnchangedAndReturnsError()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1);

        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        _storage
            .Setup(s =>
                s.UploadAsync(It.IsAny<UploadMediaRequest>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(Result<UploadMediaResponse>.InternalServerError("S3 error"));

        var result = await _service.AddMediaAsync(
            draft.Id,
            BuildFile("a.jpg", "image/jpeg", "data"),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.False);

        Context.ChangeTracker.Clear();
        var reloaded = await Context.Posts.FindAsync(draft.Id);
        Assert.That(reloaded!.MediaCount, Is.EqualTo(1));
    }

    [Test]
    public async Task AddMediaAsync_WhenSuccessful_IncrementsMediaCountAndReturnsObjectKey()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 2);

        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        SetupUploadAlwaysSucceeds();

        var result = await _service.AddMediaAsync(
            draft.Id,
            BuildFile("new.jpg", "image/jpeg", "data"),
            _user.Id.ToString(),
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content!.ObjectKey, Is.Not.Empty);
        }

        Context.ChangeTracker.Clear();
        var reloaded = await Context.Posts.FindAsync(draft.Id);
        Assert.That(reloaded!.MediaCount, Is.EqualTo(3));
    }

    // -------------------------------------------------------------------------
    // RemoveMediaAsync
    // -------------------------------------------------------------------------

    [Test]
    public async Task RemoveMediaAsync_WhenDraftNotFound_ReturnsNotFound()
    {
        SetupBuildPostMediaPrefix();

        var result = await _service.RemoveMediaAsync(
            "nonexistentslug",
            "any-key",
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task RemoveMediaAsync_WhenPostIsNotADraft_ReturnsBadRequest()
    {
        var published = await SeedPostAsync(isDraft: false, mediaCount: 2);
        SetupBuildPostMediaPrefix();

        var result = await _service.RemoveMediaAsync(
            published.Id,
            "any-key",
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task RemoveMediaAsync_WhenPostBelongsToAnotherUser_ReturnsNotFound()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 2);
        SetupBuildPostMediaPrefix();

        var result = await _service.RemoveMediaAsync(
            draft.Id,
            "any-key",
            Guid.NewGuid().ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task RemoveMediaAsync_WhenObjectKeyDoesNotBelongToPost_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 2);
        SetupBuildPostMediaPrefix();

        // Key belongs to a completely different user/post.
        var foreignKey = $"other-user/{Guid.NewGuid():N}/001.jpg";

        var result = await _service.RemoveMediaAsync(
            draft.Id,
            foreignKey,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task RemoveMediaAsync_WhenStorageDeleteFails_ReturnsErrorAndLeavesMediaCountUnchanged()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 2);

        var validKey = BuildValidKeyForDraft(draft);
        SetupBuildPostMediaPrefix();
        _storage
            .Setup(s => s.DeleteAsync(validKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.InternalServerError("S3 error"));

        var result = await _service.RemoveMediaAsync(
            draft.Id,
            validKey,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.False);

        Context.ChangeTracker.Clear();
        var reloaded = await Context.Posts.FindAsync(draft.Id);
        Assert.That(reloaded!.MediaCount, Is.EqualTo(2));
    }

    [Test]
    public async Task RemoveMediaAsync_WhenSuccessful_DecrementsMediaCountAndReturnsNoContent()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 2);

        var validKey = BuildValidKeyForDraft(draft);
        SetupBuildPostMediaPrefix();
        _storage
            .Setup(s => s.DeleteAsync(validKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.NoContent());

        var result = await _service.RemoveMediaAsync(
            draft.Id,
            validKey,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);

        Context.ChangeTracker.Clear();
        var reloaded = await Context.Posts.FindAsync(draft.Id);
        Assert.That(reloaded!.MediaCount, Is.EqualTo(1));
    }

    // -------------------------------------------------------------------------
    // PublishDraftAsync
    // -------------------------------------------------------------------------

    [Test]
    public async Task PublishDraftAsync_WhenDraftNotFound_ReturnsNotFound()
    {
        var result = await _service.PublishDraftAsync(
            "nonexistentslug",
            BuildPublishRequest(),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task PublishDraftAsync_WhenPostIsNotADraft_ReturnsBadRequest()
    {
        var published = await SeedPostAsync(isDraft: false, mediaCount: 1);

        var result = await _service.PublishDraftAsync(
            published.Id,
            BuildPublishRequest(),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task PublishDraftAsync_WhenPostBelongsToAnotherUser_ReturnsNotFound()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1);

        var result = await _service.PublishDraftAsync(
            draft.Id,
            BuildPublishRequest(),
            Guid.NewGuid().ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task PublishDraftAsync_WhenDraftHasNoMedia_ReturnsBadRequest()
    {
        // MediaCount = 0 — user removed all files from the carousel.
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 0);

        var result = await _service.PublishDraftAsync(
            draft.Id,
            BuildPublishRequest(),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task PublishDraftAsync_WhenSuccessful_SetsFormFieldsAndClearsExpiresAt()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 2);
        var request = BuildPublishRequest();

        var result = await _service.PublishDraftAsync(
            draft.Id,
            request,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);

        Context.ChangeTracker.Clear();
        var post = await Context.Posts.FindAsync(draft.Id);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(post!.IsDraft, Is.False);
            Assert.That(post.ExpiresAt, Is.Null);
            Assert.That(post.Hobby, Is.EqualTo(request.Hobby));
            Assert.That(post.Title, Is.EqualTo(request.Title));
            Assert.That(post.Description, Is.EqualTo(request.Description));
            Assert.That(post.AvailableForTrade, Is.EqualTo(request.AvailableForTrade));
            Assert.That(post.LookingFor, Is.EqualTo(request.LookingFor));
        }
    }

    [Test]
    public async Task PublishDraftAsync_WhenSuccessful_ReturnsPostId()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1);

        var result = await _service.PublishDraftAsync(
            draft.Id,
            BuildPublishRequest(),
            _user.Id.ToString(),
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content!.PostId, Is.EqualTo(draft.Id));
        }
    }

    // -------------------------------------------------------------------------
    // DiscardDraftAsync
    // -------------------------------------------------------------------------

    [Test]
    public async Task DiscardDraftAsync_WhenDraftNotFound_ReturnsNotFound()
    {
        var result = await _service.DiscardDraftAsync(
            "nonexistentslug",
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task DiscardDraftAsync_WhenPostIsNotADraft_ReturnsBadRequest()
    {
        var published = await SeedPostAsync(isDraft: false, mediaCount: 1);

        var result = await _service.DiscardDraftAsync(
            published.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task DiscardDraftAsync_WhenPostBelongsToAnotherUser_ReturnsNotFound()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1);

        var result = await _service.DiscardDraftAsync(
            draft.Id,
            Guid.NewGuid().ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task DiscardDraftAsync_WhenSuccessful_DeletesPostFromDatabaseAndTriggersStorageCleanup()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 2);
        var expectedPrefix = $"{_user.Id}/{draft.Id}/";

        SetupBuildPostMediaPrefix();
        _storage
            .Setup(s => s.DeleteByPrefixAsync(expectedPrefix, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.NoContent());

        var result = await _service.DiscardDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);

        Context.ChangeTracker.Clear();
        Assert.That(await Context.Posts.FindAsync(draft.Id), Is.Null);
        _storage.Verify(
            s => s.DeleteByPrefixAsync(expectedPrefix, It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Test]
    public async Task DiscardDraftAsync_WhenStorageCleanupFails_StillDeletesPostAndReturnsNoContent()
    {
        // Best-effort cleanup — S3 failures must not block the user from discarding.
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1);

        SetupBuildPostMediaPrefix();
        _storage
            .Setup(s => s.DeleteByPrefixAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.InternalServerError("S3 unavailable"));

        var result = await _service.DiscardDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);

        Context.ChangeTracker.Clear();
        Assert.That(await Context.Posts.FindAsync(draft.Id), Is.Null);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private async Task<PostEntity> SeedPostAsync(bool isDraft, int mediaCount)
    {
        var post = new PostEntity
        {
            Id = SlugGenerator.Generate(),
            UserId = _user.Id,
            IsDraft = isDraft,
            MediaCount = mediaCount,
            ExpiresAt = isDraft
                ? DateTimeOffset.UtcNow.AddDays(PostDraftConfig.DraftLifetimeDays)
                : null,
            Hobby = isDraft ? null : "Photography",
            Title = isDraft ? null : "My Post",
            Description = isDraft ? null : "A description",
            CreatedAt = DateTimeOffset.UtcNow,
            Likes = 0,
        };
        Context.Posts.Add(post);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();
        return post;
    }

    /// <summary>
    /// Builds an object key that passes the prefix-ownership check for <see cref="_user"/>.
    /// </summary>
    private string BuildValidKeyForDraft(PostEntity draft) =>
        $"{_user.Id}/{draft.Id}/{Guid.NewGuid():N}.jpg";

    private void SetupBuildDraftMediaObjectKey()
    {
        _storage
            .Setup(s =>
                s.BuildDraftMediaObjectKey(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<Guid>(),
                    It.IsAny<string>()
                )
            )
            .Returns(
                (string uid, string pid, Guid mid, string fn) =>
                {
                    var ext = Path.GetExtension(fn);
                    return $"{uid}/{pid}/{mid:N}{ext}";
                }
            );
    }

    private void SetupBuildPostMediaPrefix()
    {
        _storage
            .Setup(s => s.BuildPostMediaPrefix(It.IsAny<string>(), It.IsAny<string>()))
            .Returns((string uid, string pid) => $"{uid}/{pid}/");
    }

    private void SetupUploadAlwaysSucceeds()
    {
        _storage
            .Setup(s =>
                s.UploadAsync(It.IsAny<UploadMediaRequest>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(
                (UploadMediaRequest r, CancellationToken _) =>
                    Result<UploadMediaResponse>.Success(
                        new UploadMediaResponse
                        {
                            ObjectKey = r.ObjectKey,
                            ContentType = r.ContentType,
                            SizeBytes = r.ContentLength,
                        }
                    )
            );
    }

    private static PublishPostRequest BuildPublishRequest() =>
        new()
        {
            Hobby = "Photography",
            Title = "Custom shelf",
            Description = "Handmade oak shelf",
            AvailableForTrade = true,
            LookingFor = "Pottery tools",
        };

    private static FormFile BuildFile(string fileName, string contentType, string content)
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }
}
