using System.Text;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Services.MediaStorageServices;
using Hobbyist.Api.Services.PostServices.CreatePostServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests;

[TestFixture]
public class CreatePostServiceTests : DatabaseTestBase
{
    private Mock<IMediaStorageService> _mediaStorageServiceMock = null!;
    private CreatePostService _service = null!;

    protected override Task OnSetUpAsync()
    {
        _mediaStorageServiceMock = new Mock<IMediaStorageService>(MockBehavior.Strict);
        _service = new CreatePostService(
            _mediaStorageServiceMock.Object,
            Context,
            NullLogger<CreatePostService>.Instance
        );

        return Task.CompletedTask;
    }

    [Test]
    public async Task CreatePostAsync_WithEmptyMedia_ReturnsBadRequest()
    {
        // Arrange
        var request = BuildCreatePostRequest([]);

        // Act
        var result = await _service.CreatePostAsync(
            request,
            Guid.NewGuid().ToString(),
            CancellationToken.None
        );

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("At least one media file is required."));
        }
    }

    [Test]
    public async Task CreatePostAsync_WithInvalidUserId_ReturnsBadRequest()
    {
        // Arrange
        var request = BuildCreatePostRequest([BuildFile("one.png", "image/png", "one")]);

        // Act
        var result = await _service.CreatePostAsync(request, "not-a-guid", CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("Invalid user identifier."));
        }
    }

    [Test]
    public async Task CreatePostAsync_WhenSecondUploadFails_RollsBackFirstUploadOnly()
    {
        // Arrange
        var user = await CreateUserAsync();
        var files = new[]
        {
            BuildFile("one.png", "image/png", "file-one"),
            BuildFile("two.png", "image/png", "file-two"),
        };
        var request = BuildCreatePostRequest(files);

        SetupBuildObjectKey();

        _mediaStorageServiceMock
            .Setup(m =>
                m.UploadAsync(It.IsAny<UploadMediaRequest>(), It.IsAny<CancellationToken>())
            )
            .Returns(
                (UploadMediaRequest req, CancellationToken _) =>
                    Task.FromResult(
                        req.ObjectKey.EndsWith("/002.png", StringComparison.Ordinal)
                            ? Result<UploadMediaResponse>.InternalServerError("Upload failed")
                            : Result<UploadMediaResponse>.Success(
                                new UploadMediaResponse
                                {
                                    ObjectKey = req.ObjectKey,
                                    ContentType = req.ContentType,
                                    SizeBytes = req.ContentLength,
                                }
                            )
                    )
            );

        _mediaStorageServiceMock
            .Setup(m => m.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.NoContent());

        // Act
        var result = await _service.CreatePostAsync(
            request,
            user.Id.ToString(),
            CancellationToken.None
        );

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        _mediaStorageServiceMock.Verify(
            m =>
                m.DeleteAsync(
                    It.Is<string>(k => k.EndsWith("/001.png", StringComparison.Ordinal)),
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
        _mediaStorageServiceMock.Verify(
            m =>
                m.DeleteAsync(
                    It.Is<string>(k => k.EndsWith("/002.png", StringComparison.Ordinal)),
                    It.IsAny<CancellationToken>()
                ),
            Times.Never
        );
    }

    [Test]
    public async Task CreatePostAsync_WhenSuccessful_UploadsMediaWithIndexBasedKeys()
    {
        // Arrange
        var user = await CreateUserAsync();
        var files = new[]
        {
            BuildFile("one.png", "image/png", "file-one"),
            BuildFile("two.jpg", "image/jpeg", "file-two"),
        };
        var request = BuildCreatePostRequest(files);

        SetupBuildObjectKey();
        SetupUploadAlwaysSuccess();

        // Act
        var result = await _service.CreatePostAsync(
            request,
            user.Id.ToString(),
            CancellationToken.None
        );

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _mediaStorageServiceMock.Verify(
            m =>
                m.UploadAsync(
                    It.Is<UploadMediaRequest>(r =>
                        r.ObjectKey.EndsWith("/001.png", StringComparison.Ordinal)
                    ),
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
        _mediaStorageServiceMock.Verify(
            m =>
                m.UploadAsync(
                    It.Is<UploadMediaRequest>(r =>
                        r.ObjectKey.EndsWith("/002.jpg", StringComparison.Ordinal)
                    ),
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    [Test]
    public async Task CreatePostAsync_WhenPostPersistenceFails_RollsBackUploadedMedia()
    {
        // Arrange
        var missingUserId = Guid.NewGuid().ToString();
        var request = BuildCreatePostRequest([BuildFile("one.png", "image/png", "one")]);

        SetupBuildObjectKey();
        SetupUploadAlwaysSuccess();
        _mediaStorageServiceMock
            .Setup(m => m.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.NoContent());

        // Act
        var result = await _service.CreatePostAsync(request, missingUserId, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
        }
        _mediaStorageServiceMock.Verify(
            m => m.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
        Assert.That(Context.Posts.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task CreatePostAsync_WhenSuccessful_ReturnsResponseAndPersistsPost()
    {
        // Arrange
        var user = await CreateUserAsync();
        var files = new[]
        {
            BuildFile("one.png", "image/png", "one"),
            BuildFile("two.jpg", "image/jpeg", "two"),
        };
        var request = BuildCreatePostRequest(files);

        SetupBuildObjectKey();
        SetupUploadAlwaysSuccess();

        // Act
        var result = await _service.CreatePostAsync(
            request,
            user.Id.ToString(),
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content, Is.Not.Null);
        }

        var post = Context.Posts.SingleOrDefault(p => p.Id == result.Content!.PostId);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Content!.PostId, Is.Not.Empty);
            Assert.That(post, Is.Not.Null);
            Assert.That(post!.UserId, Is.EqualTo(user.Id));
            Assert.That(post.IsDraft, Is.False);
            Assert.That(post.MediaCount, Is.EqualTo(2));
        }
    }

    private void SetupBuildObjectKey()
    {
        _mediaStorageServiceMock
            .Setup(m =>
                m.BuildObjectKey(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<int>(),
                    It.IsAny<string>()
                )
            )
            .Returns(
                (string id, string pid, int index, string fileName) =>
                    $"{id}/{pid}/{index:D3}{Path.GetExtension(fileName)}"
            );
    }

    private void SetupUploadAlwaysSuccess()
    {
        _mediaStorageServiceMock
            .Setup(m =>
                m.UploadAsync(It.IsAny<UploadMediaRequest>(), It.IsAny<CancellationToken>())
            )
            .Returns(
                (UploadMediaRequest request, CancellationToken _) =>
                    Task.FromResult(
                        Result<UploadMediaResponse>.Success(
                            new UploadMediaResponse
                            {
                                ObjectKey = request.ObjectKey,
                                ContentType = request.ContentType,
                                SizeBytes = request.ContentLength,
                            }
                        )
                    )
            );
    }

    private static CreatePostRequest BuildCreatePostRequest(IFormFile[] media)
    {
        return new CreatePostRequest
        {
            Hobby = "Woodworking",
            Title = "Custom shelf",
            Description = "Handmade oak shelf",
            AvailableForTrade = true,
            LookingFor = "Pottery tools",
            Media = media,
        };
    }

    private async Task<UserEntity> CreateUserAsync()
    {
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Username = $"user-{Guid.NewGuid():N}",
            Email = $"test-{Guid.NewGuid():N}@example.com",
            PasswordHash = "hash",
            Firstname = "Test",
            Lastname = "User",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        Context.Users.Add(user);
        await Context.SaveChangesAsync();
        return user;
    }

    private static FormFile BuildFile(string fileName, string contentType, string content)
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);

        return new FormFile(stream, 0, bytes.Length, "media", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }
}
