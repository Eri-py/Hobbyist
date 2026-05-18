using Amazon.S3;
using Hobbyist.Api.Services.MediaStorageServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests;

[TestFixture]
public class MinIOMediaStorageServiceTests
{
    [Test]
    public void BuildObjectKey_WithValidInputs_ReturnsUserScopedDeterministicPath()
    {
        // Arrange
        var service = BuildService();
        var userId = "user-42";
        var postId = new Guid("11111111-2222-3333-4444-555555555555");

        // Act
        var key = service.BuildObjectKey(userId, postId, 1, "image.png");

        // Assert
        Assert.That(key, Is.EqualTo($"{userId}/{postId:N}/001.png"));
    }

    [Test]
    public void BuildObjectKey_WithNonPositiveIndex_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        var service = BuildService();

        // Act + Assert
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            service.BuildObjectKey("user-42", Guid.NewGuid(), 0, "image.png")
        );
    }

    [Test]
    public void BuildObjectKey_WithTwoDigitIndex_PadsToThreeDigits()
    {
        // Arrange
        var service = BuildService();
        var postId = new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        // Act
        var key = service.BuildObjectKey("user-42", postId, 12, "clip.mp4");

        // Assert
        Assert.That(key, Is.EqualTo($"user-42/{postId:N}/012.mp4"));
    }

    [Test]
    public void BuildObjectKey_WithoutExtension_DoesNotAppendDot()
    {
        // Arrange
        var service = BuildService();
        var postId = new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        // Act
        var key = service.BuildObjectKey("user-42", postId, 3, "blob");

        // Assert
        Assert.That(key, Is.EqualTo($"user-42/{postId:N}/003"));
    }

    [Test]
    public void BuildDraftMediaObjectKey_WithValidInputs_ReturnsUserAndPostScopedPath()
    {
        // Arrange
        var service = BuildService();
        var userId = "user-42";
        var postId = new Guid("11111111-2222-3333-4444-555555555555");
        var mediaId = new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        // Act
        var key = service.BuildDraftMediaObjectKey(userId, postId, mediaId, "photo.jpg");

        // Assert
        Assert.That(key, Is.EqualTo($"{userId}/{postId:N}/{mediaId:N}.jpg"));
    }

    [Test]
    public void BuildDraftMediaObjectKey_WithoutExtension_DoesNotAppendDot()
    {
        // Arrange
        var service = BuildService();
        var postId = new Guid("11111111-2222-3333-4444-555555555555");
        var mediaId = new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        // Act
        var key = service.BuildDraftMediaObjectKey("user-42", postId, mediaId, "blob");

        // Assert
        Assert.That(key, Is.EqualTo($"user-42/{postId:N}/{mediaId:N}"));
    }

    [Test]
    public void BuildPostMediaPrefix_ReturnsTrailingSlashScopedPath()
    {
        // Arrange
        var service = BuildService();
        var userId = "user-42";
        var postId = new Guid("11111111-2222-3333-4444-555555555555");

        // Act
        var prefix = service.BuildPostMediaPrefix(userId, postId);

        // Assert
        Assert.That(prefix, Is.EqualTo($"{userId}/{postId:N}/"));
    }

    [Test]
    public void BuildPostMediaPrefix_StartsEveryDraftMediaObjectKey()
    {
        // Both key builders share the same prefix — ownership validation in PostDraftService relies on this.
        var service = BuildService();
        var userId = "user-42";
        var postId = new Guid("11111111-2222-3333-4444-555555555555");
        var mediaId = Guid.NewGuid();

        var prefix = service.BuildPostMediaPrefix(userId, postId);
        var draftKey = service.BuildDraftMediaObjectKey(userId, postId, mediaId, "clip.mp4");
        var legacyKey = service.BuildObjectKey(userId, postId, 1, "image.png");

        using (Assert.EnterMultipleScope())
        {
            Assert.That(draftKey.StartsWith(prefix, StringComparison.Ordinal), Is.True);
            Assert.That(legacyKey.StartsWith(prefix, StringComparison.Ordinal), Is.True);
        }
    }

    private static MinIOMediaStorageService BuildService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["MediaStorage:BucketName"] = "posts-bucket" }
            )
            .Build();

        return new MinIOMediaStorageService(
            new Mock<IAmazonS3>(MockBehavior.Strict).Object,
            config,
            NullLogger<MinIOMediaStorageService>.Instance
        );
    }
}
