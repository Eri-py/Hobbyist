using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostUploadServices;

public partial class PostUploadService
{
    public async Task<Result<FinalizeResponse>> FinalizeAsync(
        string slug,
        string userId,
        CancellationToken ct
    )
    {
        if (!Guid.TryParse(userId, out var userGuid))
            return Result<FinalizeResponse>.BadRequest("Invalid user identifier.");

        var post = await LoadOwnedPostAsync(slug, userGuid, ct);
        if (post is null)
            return Result<FinalizeResponse>.NotFound("Post not found.");

        // Idempotent: a post that's already live finalizes successfully.
        if (post.Status == PostStatus.Published)
            return Result<FinalizeResponse>.Success(
                new FinalizeResponse { Published = true, PendingPositions = [] }
            );

        if (post.Status is not (PostStatus.Uploading or PostStatus.Draft))
            return Result<FinalizeResponse>.BadRequest("This post cannot be finalized.");

        var pendingPositions = new List<int>();
        foreach (var media in post.Media.Where(m => m.Status == PostMediaStatus.Pending).ToList())
        {
            var objectKey = MediaObjectKeys.BuildObjectKey(
                userId,
                slug,
                media.Id,
                media.FileExtension
            );

            var headResult = await objectStore.HeadObjectAsync(objectKey, ct);
            if (!headResult.IsSuccess)
                return Result<FinalizeResponse>.FromError(headResult);

            var info = headResult.Content!;
            if (info.Exists && info.ContentLength == media.ByteSize)
                media.Status = PostMediaStatus.Uploaded;
            else
                pendingPositions.Add(media.Position);
        }

        var published = pendingPositions.Count == 0;
        if (published)
        {
            // Publishing requires complete metadata; drafts may be incomplete, so validate here.
            var validationError = PostHelpers.ValidateDraftForPublish(post, post.Media.Count);
            if (validationError is not null)
                return Result<FinalizeResponse>.BadRequest(validationError);

            post.Status = PostStatus.Published;
            post.PublishedAt = DateTimeOffset.UtcNow;
        }

        try
        {
            // Persist whatever flipped to Uploaded (incremental progress) plus any publish transition.
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Failed to finalize post {PostId}", slug);
            return Result<FinalizeResponse>.InternalServerError(
                "Failed to finalize the post. Please try again."
            );
        }

        return Result<FinalizeResponse>.Success(
            new FinalizeResponse { Published = published, PendingPositions = [.. pendingPositions] }
        );
    }
}
