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
    /// Starts publishing a post. Validates the manifest, creates the post in the Uploading state
    /// with one Pending media row per item, and returns a pre-signed upload URL per item.
    /// </summary>
    Task<Result<InitPostResponse>> InitPublishAsync(
        InitPublishRequest request,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Starts a draft. Like <see cref="InitPublishAsync"/> but the post is created in the Draft
    /// state and incomplete metadata is allowed.
    /// </summary>
    Task<Result<InitPostResponse>> InitDraftAsync(
        InitDraftRequest request,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Verifies that every pending file of an Uploading post has landed in storage. When all are
    /// present the post is published; otherwise the still-missing indexes are returned to retry.
    /// Idempotent: finalizing an already-published post succeeds.
    /// </summary>
    Task<Result<FinalizeResponse>> FinalizeAsync(string slug, string userId, CancellationToken ct);

    /// <summary>
    /// Discards a post and its uploaded media. Allowed for draft and in-progress posts;
    /// published posts cannot be discarded.
    /// </summary>
    Task<Result> DiscardAsync(string slug, string userId, CancellationToken ct);
}
