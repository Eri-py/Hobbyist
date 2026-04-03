using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.MediaStorageServices;

public class MinIOMediaStorageService : IMediaStorageService
{
    public Task<Result> DeleteAsync(string objectKey, CancellationToken ct)
    {
        throw new NotImplementedException();
    }

    public Task<Result<string>> GetReadUrlAsync(
        string objectKey,
        TimeSpan? ttl,
        CancellationToken ct
    )
    {
        throw new NotImplementedException();
    }

    public Task<Result<UploadMediaResponse>> UploadAsync(
        UploadMediaRequest request,
        CancellationToken ct
    )
    {
        throw new NotImplementedException();
    }
}
