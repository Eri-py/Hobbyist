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
