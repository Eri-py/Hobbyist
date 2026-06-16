using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices.UrlSignerServices;

/// <summary>Generates pre-signed URLs for reading and uploading media objects.</summary>
public interface IMediaUrlSignerService
{
    /// <summary>Generates a read URL for a stored media object key (ttl defaults to 15 minutes).</summary>
    Task<Result<string>> GetReadUrlAsync(string objectKey, TimeSpan? ttl, CancellationToken ct);

    /// <summary>Pre-signed PUT URL for direct upload; content type is signed in, so the client must send it on the PUT.</summary>
    Task<Result<PresignedPut>> CreateUploadUrlAsync(
        string objectKey,
        string contentType,
        TimeSpan? ttl,
        CancellationToken ct
    );
}
