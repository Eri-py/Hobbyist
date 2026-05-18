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
        const string postId = "abc123def456";

        // Act
        var key = service.BuildObjectKey("user-42", postId, 1, "image.png");

        // Assert
        Assert.That(key, Is.EqualTo($"user-42/{postId}/001.png"));
    }

    [Test]
    public void BuildObjectKey_WithNonPositiveIndex_ThrowsArgumentOutOfRangeException()
    {
        // Arrange
        var service = BuildService();

        // Act + Assert
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            service.BuildObjectKey("user-42", "abc123def456", 0, "image.png")
        );
    }

    [Test]
    public void BuildObjectKey_WithTwoDigitIndex_PadsToThreeDigits()
    {
        // Arrange
        var service = BuildService();
        const string postId = "xyz987uvw654";

        // Act
        var key = service.BuildObjectKey("user-42", postId, 12, "clip.mp4");

        // Assert
        Assert.That(key, Is.EqualTo($"user-42/{postId}/012.mp4"));
    }

    [Test]
    public void BuildObjectKey_WithoutExtension_DoesNotAppendDot()
    {
        // Arrange
        var service = BuildService();
        const string postId = "xyz987uvw654";

        // Act
        var key = service.BuildObjectKey("user-42", postId, 3, "blob");

        // Assert
        Assert.That(key, Is.EqualTo($"user-42/{postId}/003"));
    }

    [Test]
    public void BuildDraftMediaObjectKey_WithValidInputs_ReturnsUserAndPostScopedPath()
    {
        // Arrange
        var service = BuildService();
        const string postId = "abc123def456";
        var mediaId = new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        // Act
        var key = service.BuildDraftMediaObjectKey("user-42", postId, mediaId, "photo.jpg");

        // Assert
        Assert.That(key, Is.EqualTo($"user-42/{postId}/{mediaId:N}.jpg"));
    }

    [Test]
    public void BuildDraftMediaObjectKey_WithoutExtension_DoesNotAppendDot()
    {
        // Arrange
        var service = BuildService();
        const string postId = "abc123def456";
        var mediaId = new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        // Act
        var key = service.BuildDraftMediaObjectKey("user-42", postId, mediaId, "blob");

        // Assert
        Assert.That(key, Is.EqualTo($"user-42/{postId}/{mediaId:N}"));
    }

    [Test]
    public void BuildPostMediaPrefix_ReturnsTrailingSlashScopedPath()
    {
        // Arrange
        var service = BuildService();
        const string postId = "abc123def456";

        // Act
        var prefix = service.BuildPostMediaPrefix("user-42", postId);

        // Assert
        Assert.That(prefix, Is.EqualTo($"user-42/{postId}/"));
    }

    [Test]
    public void BuildPostMediaPrefix_StartsEveryDraftMediaObjectKey()
    {
        // Both key builders share the same prefix — ownership validation in PostDraftService relies on this.
        var service = BuildService();
        const string postId = "abc123def456";
        var mediaId = Guid.NewGuid();

        var prefix = service.BuildPostMediaPrefix("user-42", postId);
        var draftKey = service.BuildDraftMediaObjectKey("user-42", postId, mediaId, "clip.mp4");
        var legacyKey = service.BuildObjectKey("user-42", postId, 1, "image.png");

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
