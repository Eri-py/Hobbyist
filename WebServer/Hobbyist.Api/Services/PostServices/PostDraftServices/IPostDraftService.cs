using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostDraftServices;

public interface IPostDraftService
{
    /// <summary>
    /// Uploads all <paramref name="media"/> files and creates a draft post that owns them.
    /// Rolls back any successful uploads if a later upload or the database save fails.
    /// </summary>
    Task<Result<CreateDraftResponse>> CreateDraftAsync(
        IFormFile[] media,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Uploads a single file and adds it to an existing draft post.
    /// The draft's <c>MediaCount</c> is incremented atomically on success.
    /// Rolls back the upload if the database save fails.
    /// </summary>
    Task<Result<AddDraftMediaResponse>> AddMediaAsync(
        string postId,
        IFormFile file,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Deletes a single media file from a draft post's S3 storage and
    /// decrements the post's <c>MediaCount</c>.
    /// The <paramref name="objectKey"/> must belong to the target post — the server validates this.
    /// </summary>
    Task<Result> RemoveMediaAsync(
        string postId,
        string objectKey,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Applies the supplied form fields to a draft post and marks it as published.
    /// Validates that at least one media file is associated with the post before publishing.
    /// </summary>
    Task<Result<CreatePostResponse>> PublishDraftAsync(
        string postId,
        PublishPostRequest request,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Deletes a draft post from the database and performs a best-effort
    /// bulk deletion of all associated S3 objects.
    /// </summary>
    Task<Result> DiscardDraftAsync(string postId, string userId, CancellationToken ct);
}
