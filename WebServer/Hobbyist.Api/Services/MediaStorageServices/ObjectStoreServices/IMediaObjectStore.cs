using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices.ObjectStoreServices;

/// <summary>Operations against stored media objects (metadata and deletion).</summary>
public interface IMediaObjectStore
{
    /// <summary>
    /// Reads metadata for a stored object without downloading it. A missing object is reported
    /// as <see cref="MediaObjectInfo.Exists"/> = false rather than an error.
    /// </summary>
    /// <param name="objectKey">Storage object key</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="MediaObjectInfo"/></returns>
    Task<Result<MediaObjectInfo>> HeadObjectAsync(string objectKey, CancellationToken ct);

    /// <summary>
    /// Deletes a media object from storage by key.
    /// </summary>
    /// <param name="objectKey">Storage object key</param>
    /// <returns>Operation result</returns>
    Task<Result> DeleteAsync(string objectKey, CancellationToken ct);

    /// <summary>
    /// Deletes every object whose key begins with <paramref name="prefix"/>.
    /// Best-effort: logs failures per object but does not abort on the first error.
    /// </summary>
    Task<Result> DeleteByPrefixAsync(string prefix, CancellationToken ct);
}
