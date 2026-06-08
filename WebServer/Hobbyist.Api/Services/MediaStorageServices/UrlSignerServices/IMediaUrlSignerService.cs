using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices.UrlSignerServices;

/// <summary>Generates pre-signed URLs for reading and uploading media objects.</summary>
public interface IMediaUrlSignerService
{
    /// <summary>
    /// Generates a read URL for a stored media object key.
    /// </summary>
    /// <param name="objectKey">Storage object key</param>
    /// <param name="ttl">Optional URL validity duration (defaults to 15 minutes)</param>
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
}
