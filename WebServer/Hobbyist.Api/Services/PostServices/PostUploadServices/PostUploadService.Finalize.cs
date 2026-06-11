using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostUploadServices;

public partial class PostUploadService
{
    public async Task<Result<FinalizeResponse>> FinalizeAsync(
        string slug,
        bool publish,
        string userId,
        CancellationToken ct
    )
    {
        if (!Guid.TryParse(userId, out var userGuid))
            return Result<FinalizeResponse>.BadRequest("Invalid user identifier.");

        var post = await LoadOwnedPostAsync(slug, userGuid, ct);
        if (post is null)
            return Result<FinalizeResponse>.NotFound("Post not found.");

        // Idempotent: a post that's already live finalizes successfully whatever the caller asks for.
        if (post.Status == PostStatus.Published)
            return Result<FinalizeResponse>.Success(
                new FinalizeResponse { Published = true, PendingPositions = [] }
            );

        // Verify the bytes against the manifest, flipping each landed file to Uploaded.
        var verifyResult = await VerifyUploadedMediaAsync(post, userId, ct);
        if (!verifyResult.IsSuccess)
            return Result<FinalizeResponse>.FromError(verifyResult);

        var pendingPositions = verifyResult.Content!;
        var allLanded = pendingPositions.Count == 0;

        // Only a publish request promotes the post; a draft finalize just verifies and stays Draft.
        var published = false;
        if (publish && allLanded)
        {
            // Publishing requires complete metadata; drafts may be incomplete, so validate here.
            var validationError = PostHelpers.ValidateDraftForPublish(post, post.Media.Count);
            if (validationError is not null)
                return Result<FinalizeResponse>.BadRequest(validationError);

            post.Status = PostStatus.Published;
            post.PublishedAt = DateTimeOffset.UtcNow;
            published = true;
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

    /// <summary>
    /// HEADs each still-Pending file, flipping it to Uploaded when the stored object matches the
    /// manifest's byte size. Returns the positions still missing (does not persist; the caller saves).
    /// </summary>
    private async Task<Result<List<int>>> VerifyUploadedMediaAsync(
        PostEntity post,
        string userId,
        CancellationToken ct
    )
    {
        var pendingPositions = new List<int>();
        foreach (var media in post.Media.Where(m => m.Status == PostMediaStatus.Pending).ToList())
        {
            var objectKey = MediaObjectKeys.BuildObjectKey(
                userId,
                post.Id,
                media.Id,
                media.FileExtension
            );

            var infoResult = await objectStore.GetObjectInfoAsync(objectKey, ct);
            if (!infoResult.IsSuccess)
                return Result<List<int>>.FromError(infoResult);

            var info = infoResult.Content!;
            if (info.Exists && info.ContentLength == media.ByteSize)
                media.Status = PostMediaStatus.Uploaded;
            else
                pendingPositions.Add(media.Position);
        }

        return Result<List<int>>.Success(pendingPositions);
    }
}
