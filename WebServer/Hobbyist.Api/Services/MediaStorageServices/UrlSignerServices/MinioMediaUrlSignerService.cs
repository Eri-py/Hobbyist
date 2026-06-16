using Amazon.S3;
using Amazon.S3.Model;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices.UrlSignerServices;

public class MinioMediaUrlSignerService(
    IAmazonS3 s3Client,
    IConfiguration configuration,
    ILogger<MinioMediaUrlSignerService> logger
) : IMediaUrlSignerService
{
    private readonly string _bucketName =
        configuration["MediaStorage:BucketName"]
        ?? throw new InvalidOperationException("Missing 'MediaStorage:BucketName' configuration.");

    // The SDK defaults the URL scheme to HTTPS regardless of ServiceURL, so drive it from UseSsl —
    // else local HTTP MinIO gets unreachable HTTPS URLs.
    private readonly Protocol _protocol =
        bool.TryParse(configuration["MediaStorage:UseSsl"], out var useSsl) && useSsl
            ? Protocol.HTTPS
            : Protocol.HTTP;

    public Task<Result<string>> GetReadUrlAsync(
        string objectKey,
        TimeSpan? ttl,
        CancellationToken ct
    )
    {
        if (string.IsNullOrWhiteSpace(objectKey))
            return Task.FromResult(Result<string>.BadRequest("Object key is required."));

        var effectiveTtl = ttl ?? TimeSpan.FromMinutes(15);
        if (effectiveTtl <= TimeSpan.Zero)
            return Task.FromResult(Result<string>.BadRequest("URL TTL must be greater than zero."));

        // AWS-style pre-signed URLs support expiration up to 7 days.
        if (effectiveTtl > TimeSpan.FromDays(7))
            return Task.FromResult(Result<string>.BadRequest("URL TTL cannot exceed 7 days."));

        try
        {
            ct.ThrowIfCancellationRequested();

            var readUrl = s3Client.GetPreSignedURL(
                new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = objectKey,
                    Verb = HttpVerb.GET,
                    Protocol = _protocol,
                    Expires = DateTimeOffset.UtcNow.Add(effectiveTtl).UtcDateTime,
                }
            );

            return Task.FromResult(Result<string>.Success(readUrl));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Failed to generate read URL for object key '{ObjectKey}'",
                objectKey.SanitizeForLog()
            );
            return Task.FromResult(
                Result<string>.InternalServerError(ErrorMessages.UnexpectedError)
            );
        }
    }

    public Task<Result<PresignedPut>> CreateUploadUrlAsync(
        string objectKey,
        string contentType,
        TimeSpan? ttl,
        CancellationToken ct
    )
    {
        if (string.IsNullOrWhiteSpace(objectKey))
            return Task.FromResult(Result<PresignedPut>.BadRequest("Object key is required."));

        if (string.IsNullOrWhiteSpace(contentType))
            return Task.FromResult(Result<PresignedPut>.BadRequest("Content type is required."));

        var effectiveTtl = ttl ?? TimeSpan.FromMinutes(15);
        if (effectiveTtl <= TimeSpan.Zero)
            return Task.FromResult(
                Result<PresignedPut>.BadRequest("URL TTL must be greater than zero.")
            );

        // AWS-style pre-signed URLs support expiration up to 7 days.
        if (effectiveTtl > TimeSpan.FromDays(7))
            return Task.FromResult(
                Result<PresignedPut>.BadRequest("URL TTL cannot exceed 7 days.")
            );

        try
        {
            ct.ThrowIfCancellationRequested();

            var expiresAt = DateTimeOffset.UtcNow.Add(effectiveTtl);

            // ContentType is signed in, so the client must send the same Content-Type on the PUT.
            var uploadUrl = s3Client.GetPreSignedURL(
                new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = objectKey,
                    Verb = HttpVerb.PUT,
                    ContentType = contentType,
                    Protocol = _protocol,
                    Expires = expiresAt.UtcDateTime,
                }
            );

            return Task.FromResult(
                Result<PresignedPut>.Success(
                    new PresignedPut
                    {
                        Url = uploadUrl,
                        RequiredHeaders = new Dictionary<string, string>
                        {
                            ["Content-Type"] = contentType,
                        },
                        ExpiresAt = expiresAt,
                    }
                )
            );
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Failed to generate upload URL for object key '{ObjectKey}'",
                objectKey.SanitizeForLog()
            );
            return Task.FromResult(
                Result<PresignedPut>.InternalServerError(ErrorMessages.UnexpectedError)
            );
        }
    }
}
