using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices;

public interface IMediaStorageService
{
    /// <summary>
    /// Uploads a media object to storage and returns persisted object metadata.
    /// </summary>
    /// <param name="request">Upload payload and metadata</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="UploadMediaResponse"/></returns>
    Task<Result<UploadMediaResponse>> UploadAsync(UploadMediaRequest request, CancellationToken ct);

    /// <summary>
    /// Deletes a media object from storage by key.
    /// </summary>
    /// <param name="objectKey">Storage object key</param>
    /// <returns>Operation result</returns>
    Task<Result> DeleteAsync(string objectKey, CancellationToken ct);

    /// <summary>
    /// Generates a read URL for a stored media object key.
    /// </summary>
    /// <param name="objectKey">Storage object key</param>
    /// <param name="ttl">Optional URL validity duration for pre-signed URLs</param>
    /// <returns><see cref="Result{T}"/> where T is the generated URL</returns>
    Task<Result<string>> GetReadUrlAsync(string objectKey, TimeSpan? ttl, CancellationToken ct);

    /// <summary>
    /// Generates a time-limited pre-signed PUT URL the client uploads bytes to directly.
    /// The content type is baked into the signature, so the client must send it on the PUT.
    /// </summary>
    /// <param name="objectKey">Storage object key the bytes will be written to</param>
    /// <param name="contentType">Content type signed into the URL and required on the PUT</param>
    /// <param name="ttl">Optional URL validity duration (defaults to 15 minutes)</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="PresignedPut"/></returns>
    Task<Result<PresignedPut>> CreateUploadUrlAsync(
        string objectKey,
        string contentType,
        TimeSpan? ttl,
        CancellationToken ct
    );

    /// <summary>
    /// Reads metadata for a stored object without downloading it. A missing object is reported
    /// as <see cref="MediaObjectInfo.Exists"/> = false rather than an error.
    /// </summary>
    /// <param name="objectKey">Storage object key</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="MediaObjectInfo"/></returns>
    Task<Result<MediaObjectInfo>> HeadObjectAsync(string objectKey, CancellationToken ct);

    /// <summary>
    /// Builds an object key for storing a post media file.
    /// </summary>
    string BuildObjectKey(string userId, string postId, int mediaIndex, string fileName);

    /// <summary>
    /// Returns the shared S3 prefix for all media belonging to a post.
    /// Used to validate ownership of an object key and to bulk-delete on discard.
    /// </summary>
    string BuildPostMediaPrefix(string userId, string postId);

    /// <summary>
    /// Deletes every object whose key begins with <paramref name="prefix"/>.
    /// Best-effort: logs failures per object but does not abort on the first error.
    /// </summary>
    Task<Result> DeleteByPrefixAsync(string prefix, CancellationToken ct);
}
