using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostUploadServices;

/// <summary>
/// Orchestrates the media-first upload flow: clients declare a manifest, receive pre-signed URLs,
/// upload bytes directly to storage, then finalize.
/// </summary>
public interface IPostUploadService
{
    /// <summary>
    /// Starts a post. Validates the manifest, creates the post in the Draft state with one Pending
    /// media row per item, and returns a pre-signed upload URL per item. Metadata may be incomplete;
    /// completeness is enforced at finalize when publishing.
    /// </summary>
    Task<Result<InitPostResponse>> InitAsync(
        InitPostRequest request,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Verifies that every pending file has landed in storage, flipping each to Uploaded. When
    /// <paramref name="publish"/> is true and all files are present (and metadata is complete) the
    /// post is published; otherwise it stays a Draft. The still-missing positions are returned in
    /// either case. Idempotent: finalizing an already-published post succeeds.
    /// </summary>
    Task<Result<FinalizeResponse>> FinalizeAsync(
        string slug,
        bool publish,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Discards a post and its uploaded media. Allowed for draft and in-progress posts;
    /// published posts cannot be discarded.
    /// </summary>
    Task<Result> DiscardAsync(string slug, string userId, CancellationToken ct);
}
