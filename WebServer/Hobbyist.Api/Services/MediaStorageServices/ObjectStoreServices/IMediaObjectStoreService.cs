using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices.ObjectStoreServices;

/// <summary>Operations against stored media objects (metadata and deletion).</summary>
public interface IMediaObjectStoreService
{
    /// <summary>Reads metadata (existence + size) without downloading; a missing object is Exists=false, not an error.</summary>
    Task<Result<MediaObjectInfo>> GetObjectInfoAsync(string objectKey, CancellationToken ct);

    /// <summary>Deletes a media object by key.</summary>
    Task<Result> DeleteAsync(string objectKey, CancellationToken ct);

    /// <summary>Deletes every object under <paramref name="prefix"/>; best-effort, doesn't abort on the first error.</summary>
    Task<Result> DeleteByPrefixAsync(string prefix, CancellationToken ct);
}
