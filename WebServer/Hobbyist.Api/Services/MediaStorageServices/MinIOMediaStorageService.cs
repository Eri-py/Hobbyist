using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices;

public class MinIOMediaStorageService(
    IAmazonS3 s3Client,
    IConfiguration configuration,
    ILogger<MinIOMediaStorageService> logger
) : IMediaStorageService
{
    private readonly string _bucketName =
        configuration["MediaStorage:BucketName"]
        ?? throw new InvalidOperationException("Missing 'MediaStorage:BucketName' configuration.");

    public async Task<Result<UploadMediaResponse>> UploadAsync(
        UploadMediaRequest request,
        CancellationToken ct
    )
    {
        if (string.IsNullOrWhiteSpace(request.ObjectKey))
            return Result<UploadMediaResponse>.BadRequest("Object key is required.");

        if (request.ContentLength <= 0)
            return Result<UploadMediaResponse>.BadRequest(
                "Content length must be greater than zero."
            );

        try
        {
            // Upload raw content stream to object storage under the generated key.
            await s3Client.PutObjectAsync(
                new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = request.ObjectKey,
                    InputStream = request.Content,
                    ContentType = request.ContentType,
                    AutoCloseStream = false,
                },
                ct
            );

            return Result<UploadMediaResponse>.Success(
                new UploadMediaResponse
                {
                    ObjectKey = request.ObjectKey,
                    ContentType = request.ContentType,
                    SizeBytes = request.ContentLength,
                }
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
                "Failed to upload media object with key '{ObjectKey}'",
                request.ObjectKey
            );
            return Result<UploadMediaResponse>.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }

    public async Task<Result> DeleteAsync(string objectKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(objectKey))
            return Result.BadRequest("Object key is required.");

        try
        {
            // Delete is idempotent in object storage. We still surface infrastructure errors.
            await s3Client.DeleteObjectAsync(
                new DeleteObjectRequest { BucketName = _bucketName, Key = objectKey },
                ct
            );
            return Result.NoContent();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete media object with key '{ObjectKey}'", objectKey);
            return Result.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }

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
                objectKey
            );
            return Task.FromResult(
                Result<string>.InternalServerError(ErrorMessages.UnexpectedError)
            );
        }
    }

    public string BuildObjectKey(string userId, Guid postId, int mediaIndex, string fileName)
    {
        if (mediaIndex <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(mediaIndex),
                "Media index must be greater than zero."
            );

        var extension = Path.GetExtension(fileName);
        var safeExtension = string.IsNullOrWhiteSpace(extension) ? string.Empty : extension;
        return $"{userId}/{postId:N}/{mediaIndex:D3}{safeExtension}";
    }

    /// <inheritdoc/>
    public string BuildDraftMediaObjectKey(
        string userId,
        Guid postId,
        Guid mediaId,
        string fileName
    )
    {
        var extension = Path.GetExtension(fileName);
        var safeExtension = string.IsNullOrWhiteSpace(extension) ? string.Empty : extension;
        return $"{userId}/{postId:N}/{mediaId:N}{safeExtension}";
    }

    /// <inheritdoc/>
    public string BuildPostMediaPrefix(string userId, Guid postId) => $"{userId}/{postId:N}/";

    /// <inheritdoc/>
    public async Task<Result> DeleteByPrefixAsync(string prefix, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(prefix))
            return Result.BadRequest("Prefix is required.");

        try
        {
            string? continuationToken = null;

            // S3 returns at most 1000 keys per page; loop until all pages are consumed.
            do
            {
                var listResponse = await s3Client.ListObjectsV2Async(
                    new ListObjectsV2Request
                    {
                        BucketName = _bucketName,
                        Prefix = prefix,
                        ContinuationToken = continuationToken,
                    },
                    ct
                );

                if (listResponse.S3Objects.Count == 0)
                    break;

                // Batch-delete up to 1000 objects in a single request.
                var deleteResponse = await s3Client.DeleteObjectsAsync(
                    new DeleteObjectsRequest
                    {
                        BucketName = _bucketName,
                        Objects =
                        [
                            .. listResponse.S3Objects.Select(o => new KeyVersion { Key = o.Key }),
                        ],
                    },
                    ct
                );

                foreach (var error in deleteResponse.DeleteErrors)
                {
                    logger.LogWarning(
                        "Failed to delete object '{Key}' under prefix '{Prefix}': {Code} — {Message}",
                        error.Key,
                        prefix,
                        error.Code,
                        error.Message
                    );
                }

                continuationToken =
                    listResponse.IsTruncated == true ? listResponse.NextContinuationToken : null;
            } while (continuationToken != null);

            return Result.NoContent();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete objects under prefix '{Prefix}'", prefix);
            return Result.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }
}
