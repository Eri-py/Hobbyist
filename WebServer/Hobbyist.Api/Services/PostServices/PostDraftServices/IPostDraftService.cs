using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostDraftServices;

public interface IPostDraftService
{
    /// <summary>
    /// Uploads all media files and creates a draft post with all form fields populated.
    /// Rolls back any successful uploads if a later upload or the database save fails.
    /// </summary>
    Task<Result<CreateDraftResponse>> CreateDraftAsync(
        SaveDraftRequest request,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Publishes a saved draft. The draft must already contain all required form
    /// fields and at least one media file. No additional data is needed from the caller.
    /// </summary>
    Task<Result<CreatePostResponse>> PublishDraftAsync(
        string postId,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Deletes a draft post from the database and performs a best-effort
    /// bulk deletion of all associated S3 objects.
    /// </summary>
    Task<Result> DiscardDraftAsync(string postId, string userId, CancellationToken ct);
}
