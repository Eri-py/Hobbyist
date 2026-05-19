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
            BuildSaveDraftRequest(media: []),
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
            BuildSaveDraftRequest(media: [BuildFile("photo.jpg", "image/jpeg", string.Empty)]),
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
            BuildSaveDraftRequest(media: [BuildFile("photo.jpg", "image/jpeg", "data")]),
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
        var files = Enumerable
            .Range(0, PostDraftConfig.MaxMediaFiles + 1)
            .Select(i => BuildFile($"photo{i}.jpg", "image/jpeg", "data"))
            .ToArray();

        var result = await _service.CreateDraftAsync(
            BuildSaveDraftRequest(media: files),
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
            BuildSaveDraftRequest(media:
            [
                BuildFile("a.jpg", "image/jpeg", "data"),
                BuildFile("b.jpg", "image/jpeg", "data"),
            ]),
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.False);
        _storage.Verify(
            s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
        Assert.That(await Context.Posts.CountAsync(), Is.Zero);
    }

    [Test]
    public async Task CreateDraftAsync_WhenDbSaveFails_RollsBackAllUploadsAndReturnsInternalServerError()
    {
        var nonExistentUserId = Guid.NewGuid().ToString();

        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        SetupUploadAlwaysSucceeds();

        _storage
            .Setup(s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.NoContent());

        var result = await _service.CreateDraftAsync(
            BuildSaveDraftRequest(media:
            [
                BuildFile("a.jpg", "image/jpeg", "data"),
                BuildFile("b.jpg", "image/jpeg", "data"),
            ]),
            nonExistentUserId,
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
        }
        _storage.Verify(
            s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2)
        );
    }

    [Test]
    public async Task CreateDraftAsync_WhenSuccessful_ReturnsPostId()
    {
        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        SetupUploadAlwaysSucceeds();

        var result = await _service.CreateDraftAsync(
            BuildSaveDraftRequest(),
            _user.Id.ToString(),
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content!.PostId, Is.Not.Empty);
        }
    }

    [Test]
    public async Task CreateDraftAsync_WhenSuccessful_WithAllFormFields_PersistsFieldsAndNoExpiry()
    {
        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        SetupUploadAlwaysSucceeds();

        var request = BuildSaveDraftRequest(
            media: [BuildFile("a.jpg", "image/jpeg", "data"), BuildFile("b.jpg", "image/jpeg", "data")],
            hobby: "Photography",
            title: "Custom shelf",
            description: "Handmade oak shelf with three adjustable levels"
        );

        var result = await _service.CreateDraftAsync(request, _user.Id.ToString(), CancellationToken.None);

        var post = await Context.Posts.FindAsync(result.Content!.PostId);
        Assert.That(post, Is.Not.Null);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(post!.IsDraft, Is.True);
            Assert.That(post.MediaCount, Is.EqualTo(2));
            Assert.That(post.Hobby, Is.EqualTo(request.Hobby));
            Assert.That(post.Title, Is.EqualTo(request.Title));
            Assert.That(post.Description, Is.EqualTo(request.Description));
            Assert.That(post.AvailableForTrade, Is.EqualTo(request.AvailableForTrade));
            Assert.That(post.LookingFor, Is.EqualTo(request.LookingFor));
        }
    }

    [Test]
    public async Task CreateDraftAsync_WhenSuccessful_WithNoFormFields_PersistsDraftWithNullFields()
    {
        SetupBuildDraftMediaObjectKey();
        SetupBuildPostMediaPrefix();
        SetupUploadAlwaysSucceeds();

        var request = BuildSaveDraftRequest(
            hobby: null,
            title: null,
            description: null
        );

        var result = await _service.CreateDraftAsync(request, _user.Id.ToString(), CancellationToken.None);

        var post = await Context.Posts.FindAsync(result.Content!.PostId);
        Assert.That(post, Is.Not.Null);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(post!.IsDraft, Is.True);
            Assert.That(post.MediaCount, Is.EqualTo(1));
            Assert.That(post.Hobby, Is.Null);
            Assert.That(post.Title, Is.Null);
            Assert.That(post.Description, Is.Null);
        }
    }

    // -------------------------------------------------------------------------
    // PublishDraftAsync
    // -------------------------------------------------------------------------

    [Test]
    public async Task PublishDraftAsync_WhenDraftNotFound_ReturnsNotFound()
    {
        var result = await _service.PublishDraftAsync(
            "nonexistentslug",
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
            Guid.NewGuid().ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    }

    [Test]
    public async Task PublishDraftAsync_WhenDraftHasNoMedia_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 0);

        var result = await _service.PublishDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task PublishDraftAsync_WhenHobbyIsNull_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1, hobby: null);

        var result = await _service.PublishDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task PublishDraftAsync_WhenTitleIsNull_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1, title: null);

        var result = await _service.PublishDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task PublishDraftAsync_WhenDescriptionIsNull_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1, description: null);

        var result = await _service.PublishDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task PublishDraftAsync_WhenDescriptionTooShort_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1, description: "Too short");

        var result = await _service.PublishDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task PublishDraftAsync_WhenAvailableForTradeWithNoLookingFor_ReturnsBadRequest()
    {
        var draft = await SeedPostAsync(
            isDraft: true,
            mediaCount: 1,
            availableForTrade: true,
            lookingFor: null
        );

        var result = await _service.PublishDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
    }

    [Test]
    public async Task PublishDraftAsync_WhenSuccessful_PublishesDraft()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 2);

        var result = await _service.PublishDraftAsync(
            draft.Id,
            _user.Id.ToString(),
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);

        Context.ChangeTracker.Clear();
        var post = await Context.Posts.FindAsync(draft.Id);

        Assert.That(post!.IsDraft, Is.False);
    }

    [Test]
    public async Task PublishDraftAsync_WhenSuccessful_ReturnsPostId()
    {
        var draft = await SeedPostAsync(isDraft: true, mediaCount: 1);

        var result = await _service.PublishDraftAsync(
            draft.Id,
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

    private async Task<PostEntity> SeedPostAsync(
        bool isDraft,
        int mediaCount,
        string? hobby = "Photography",
        string? title = "My Post",
        string? description = "A sufficient description that meets the minimum",
        bool availableForTrade = false,
        string? lookingFor = null
    )
    {
        var post = new PostEntity
        {
            Id = SlugGenerator.Generate(),
            UserId = _user.Id,
            IsDraft = isDraft,
            MediaCount = mediaCount,
            Hobby = hobby,
            Title = title,
            Description = description,
            AvailableForTrade = availableForTrade,
            LookingFor = lookingFor,
            CreatedAt = DateTimeOffset.UtcNow,
            Likes = 0,
        };
        Context.Posts.Add(post);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();
        return post;
    }

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

    private static SaveDraftRequest BuildSaveDraftRequest(
        IFormFile[]? media = null,
        string? hobby = "Photography",
        string? title = "Custom shelf",
        string? description = "Handmade oak shelf with three adjustable levels",
        bool availableForTrade = false,
        string? lookingFor = null
    ) =>
        new()
        {
            Hobby = hobby,
            Title = title,
            Description = description,
            AvailableForTrade = availableForTrade,
            LookingFor = lookingFor,
            Media = media ?? [BuildFile("a.jpg", "image/jpeg", "data")],
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
