using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostUploadServices;

public partial class PostUploadService
{
    public async Task<Result> DiscardAsync(string slug, string userId, CancellationToken ct)
    {
        if (!Guid.TryParse(userId, out var userGuid))
            return Result.BadRequest("Invalid user identifier.");

        var post = await LoadOwnedPostAsync(slug, userGuid, ct);
        if (post is null)
            return Result.NotFound("Post not found.");

        if (post.Status == PostStatus.Published)
            return Result.BadRequest("Published posts cannot be discarded.");

        // Delete the stored objects first; abort if that fails so we never orphan media.
        var prefix = MediaObjectKeys.BuildPostMediaPrefix(userId, slug);
        var storageResult = await objectStore.DeleteByPrefixAsync(prefix, ct);
        if (!storageResult.IsSuccess)
        {
            logger.LogError(
                "Failed to delete storage objects for post {PostId} (prefix '{Prefix}'). "
                    + "Aborting discard to avoid orphaned media.",
                slug,
                prefix
            );
            return Result.InternalServerError(
                "Failed to delete the post's media. Please try again."
            );
        }

        context.Posts.Remove(post);

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Failed to remove post {PostId} from the database", slug);
            return Result.InternalServerError(ErrorMessages.UnexpectedError);
        }

        return Result.NoContent();
    }
}
