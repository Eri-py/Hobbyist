using Amazon.Runtime;
using Amazon.S3;
using Hobbyist.Api.Services.MediaStorageServices.UrlSignerServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace Hobbyist.Tests.MediaStorageServicesTests;

[TestFixture]
public class MinioMediaUrlSignerServiceTests
{
    // Pre-signing is local crypto — no network call is made, so a real client is safe.
    private static MinioMediaUrlSignerService CreateSigner(bool useSsl)
    {
        var endpoint = useSsl ? "https://localhost:9000" : "http://localhost:9000";

        var s3Client = new AmazonS3Client(
            new BasicAWSCredentials("minioadmin", "Password123."),
            new AmazonS3Config
            {
                ServiceURL = endpoint,
                ForcePathStyle = true,
                UseHttp = !useSsl,
            }
        );

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["MediaStorage:BucketName"] = "hobbyist-posts",
                    ["MediaStorage:UseSsl"] = useSsl.ToString(),
                }
            )
            .Build();

        return new MinioMediaUrlSignerService(
            s3Client,
            configuration,
            NullLogger<MinioMediaUrlSignerService>.Instance
        );
    }

    [Test]
    public async Task CreateUploadUrlAsync_WhenUseSslFalse_SignsAnHttpUrl()
    {
        var signer = CreateSigner(useSsl: false);

        var result = await signer.CreateUploadUrlAsync(
            "user/post/file.png",
            "image/png",
            null,
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!.Url, Does.StartWith("http://localhost:9000"));
    }

    [Test]
    public async Task CreateUploadUrlAsync_WhenUseSslTrue_SignsAnHttpsUrl()
    {
        var signer = CreateSigner(useSsl: true);

        var result = await signer.CreateUploadUrlAsync(
            "user/post/file.png",
            "image/png",
            null,
            CancellationToken.None
        );

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!.Url, Does.StartWith("https://localhost:9000"));
    }

    [Test]
    public async Task GetReadUrlAsync_WhenUseSslFalse_SignsAnHttpUrl()
    {
        var signer = CreateSigner(useSsl: false);

        var result = await signer.GetReadUrlAsync("user/post/file.png", null, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content!, Does.StartWith("http://localhost:9000"));
    }
}
