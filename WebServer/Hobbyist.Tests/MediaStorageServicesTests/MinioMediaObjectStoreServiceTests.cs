using Amazon.S3;
using Amazon.S3.Model;
using Hobbyist.Api.Services.MediaStorageServices.ObjectStoreServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests.MediaStorageServicesTests;

[TestFixture]
public class MinioMediaObjectStoreServiceTests
{
    private Mock<IAmazonS3> _s3Mock = null!;
    private MinioMediaObjectStoreService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _s3Mock = new Mock<IAmazonS3>();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["MediaStorage:BucketName"] = "hobbyist-posts" }
            )
            .Build();

        _service = new MinioMediaObjectStoreService(
            _s3Mock.Object,
            configuration,
            NullLogger<MinioMediaObjectStoreService>.Instance
        );
    }

    [Test]
    public async Task DeleteByPrefixAsync_WhenPrefixHasNoObjects_SucceedsWithoutDeleting()
    {
        // SDK v4 returns a null collection (not empty) when nothing matches the prefix.
        // This is the discard-before-upload case that previously threw a NullReferenceException.
        _s3Mock
            .Setup(s =>
                s.ListObjectsV2Async(It.IsAny<ListObjectsV2Request>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(new ListObjectsV2Response { S3Objects = null, IsTruncated = false });

        var result = await _service.DeleteByPrefixAsync("user/post/", CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        _s3Mock.Verify(
            s => s.DeleteObjectsAsync(It.IsAny<DeleteObjectsRequest>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Test]
    public async Task DeleteByPrefixAsync_WhenPrefixHasObjects_BatchDeletesThem()
    {
        _s3Mock
            .Setup(s =>
                s.ListObjectsV2Async(It.IsAny<ListObjectsV2Request>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(
                new ListObjectsV2Response
                {
                    S3Objects =
                    [
                        new S3Object { Key = "user/post/a.png" },
                        new S3Object { Key = "user/post/b.png" },
                    ],
                    IsTruncated = false,
                }
            );

        DeleteObjectsRequest? captured = null;
        _s3Mock
            .Setup(s =>
                s.DeleteObjectsAsync(It.IsAny<DeleteObjectsRequest>(), It.IsAny<CancellationToken>())
            )
            .Callback<DeleteObjectsRequest, CancellationToken>((req, _) => captured = req)
            .ReturnsAsync(new DeleteObjectsResponse());

        var result = await _service.DeleteByPrefixAsync("user/post/", CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        _s3Mock.Verify(
            s => s.DeleteObjectsAsync(It.IsAny<DeleteObjectsRequest>(), It.IsAny<CancellationToken>()),
            Times.Once
        );
        Assert.That(captured, Is.Not.Null);
        Assert.That(
            captured!.Objects.Select(o => o.Key),
            Is.EquivalentTo(new[] { "user/post/a.png", "user/post/b.png" })
        );
    }
}
