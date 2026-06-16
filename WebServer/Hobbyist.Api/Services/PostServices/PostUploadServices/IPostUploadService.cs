using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostUploadServices;

/// <summary>Orchestrates the media-first upload flow: declare manifest → pre-signed URLs → direct upload → finalize.</summary>
public interface IPostUploadService
{
    /// <summary>Starts a Draft post with a Pending media row + pre-signed URL per item; metadata checked at finalize.</summary>
    Task<Result<InitPostResponse>> InitAsync(
        InitPostRequest request,
        string userId,
        CancellationToken ct
    );

    /// <summary>Verifies pending files landed (→ Uploaded); publishes if <paramref name="publish"/> and all present + metadata complete, else stays Draft. Returns still-missing positions; idempotent.</summary>
    Task<Result<FinalizeResponse>> FinalizeAsync(
        string slug,
        bool publish,
        string userId,
        CancellationToken ct
    );

    /// <summary>Discards a post and its media; allowed for draft/in-progress, not published.</summary>
    Task<Result> DiscardAsync(string slug, string userId, CancellationToken ct);
}
