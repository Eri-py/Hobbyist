using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices.ObjectStoreServices;

public class MinioMediaObjectStore(
    IAmazonS3 s3Client,
    IConfiguration configuration,
    ILogger<MinioMediaObjectStore> logger
) : IMediaObjectStore
{
    private readonly string _bucketName =
        configuration["MediaStorage:BucketName"]
        ?? throw new InvalidOperationException("Missing 'MediaStorage:BucketName' configuration.");

    public async Task<Result<MediaObjectInfo>> HeadObjectAsync(
        string objectKey,
        CancellationToken ct
    )
    {
        if (string.IsNullOrWhiteSpace(objectKey))
            return Result<MediaObjectInfo>.BadRequest("Object key is required.");

        try
        {
            var metadata = await s3Client.GetObjectMetadataAsync(
                new GetObjectMetadataRequest { BucketName = _bucketName, Key = objectKey },
                ct
            );

            return Result<MediaObjectInfo>.Success(
                new MediaObjectInfo
                {
                    Exists = true,
                    ContentLength = metadata.ContentLength,
                    ContentType = metadata.Headers.ContentType,
                }
            );
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            // A missing object is a normal answer ("not uploaded yet"), not a failure.
            return Result<MediaObjectInfo>.Success(
                new MediaObjectInfo { Exists = false, ContentLength = 0 }
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
                "Failed to read metadata for object key '{ObjectKey}'",
                objectKey.SanitizeForLog()
            );
            return Result<MediaObjectInfo>.InternalServerError(ErrorMessages.UnexpectedError);
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
            logger.LogError(
                ex,
                "Failed to delete media object with key '{ObjectKey}'",
                objectKey.SanitizeForLog()
            );
            return Result.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }

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

                foreach (var error in deleteResponse.DeleteErrors ?? [])
                {
                    logger.LogWarning(
                        "Failed to delete object '{Key}' under prefix '{Prefix}': {Code} — {Message}",
                        error.Key.SanitizeForLog(),
                        prefix.SanitizeForLog(),
                        error.Code.SanitizeForLog(),
                        error.Message.SanitizeForLog()
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
            logger.LogError(
                ex,
                "Failed to delete objects under prefix '{Prefix}'",
                prefix.SanitizeForLog()
            );
            return Result.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }
}
