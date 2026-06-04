using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Services.MediaStorageServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.PostServices.PostDraftServices;

public class PostDraftService(
    IMediaStorageService mediaStorageService,
    HobbyistDbContext context,
    ILogger<PostDraftService> logger
) : IPostDraftService
{
    /// <inheritdoc/>
    public async Task<Result<CreateDraftResponse>> CreateDraftAsync(
        SaveDraftRequest request,
        string userId,
        CancellationToken ct
    )
    {
        var mediaError = PostHelpers.ValidateMedia(request.Media);
        if (mediaError is not null)
            return Result<CreateDraftResponse>.BadRequest(mediaError);

        if (!Guid.TryParse(userId, out var userGuid))
            return Result<CreateDraftResponse>.BadRequest("Invalid user identifier.");

        var postId = SlugGenerator.Generate();

        var uploadResult = await PostHelpers.UploadPostMediaAsync(
            request.Media,
            userId,
            postId,
            mediaStorageService,
            logger,
            ct
        );
        if (!uploadResult.IsSuccess)
            return Result<CreateDraftResponse>.FromError(uploadResult);

        context.Posts.Add(
            new PostEntity
            {
                Id = postId,
                UserId = userGuid,
                Hobby = request.Hobby,
                Title = request.Title,
                Description = request.Description,
                AvailableForTrade = request.AvailableForTrade,
                LookingFor = request.LookingFor,
                IsDraft = true,
                MediaCount = request.Media.Length,
                CreatedAt = DateTimeOffset.UtcNow,
                Likes = 0,
            }
        );

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(
                ex,
                "Failed to persist draft post {PostId} for user {UserId}",
                postId,
                userId
            );
            await PostHelpers.CleanupUploadedObjectsAsync(
                uploadResult.Content!,
                mediaStorageService,
                logger,
                ct
            );
            return Result<CreateDraftResponse>.InternalServerError(ErrorMessages.UnexpectedError);
        }

        return Result<CreateDraftResponse>.Success(new CreateDraftResponse { PostId = postId });
    }

    /// <inheritdoc/>
    public async Task<Result<CreatePostResponse>> PublishDraftAsync(
        string postId,
        string userId,
        CancellationToken ct
    )
    {
        if (!Guid.TryParse(userId, out var userGuid))
            return Result<CreatePostResponse>.BadRequest("Invalid user identifier.");

        var post = await context.Posts.FirstOrDefaultAsync(
            p => p.Id == postId && p.UserId == userGuid,
            ct
        );

        if (post is null)
            return Result<CreatePostResponse>.NotFound("Draft post not found.");

        if (!post.IsDraft)
            return Result<CreatePostResponse>.BadRequest("Post is already published.");

        var publishError = PostHelpers.ValidateDraftForPublish(post);
        if (publishError is not null)
            return Result<CreatePostResponse>.BadRequest(publishError);

        post.IsDraft = false;
        post.CreatedAt = DateTimeOffset.UtcNow;

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Failed to publish draft post {PostId}", postId);
            return Result<CreatePostResponse>.InternalServerError(ErrorMessages.UnexpectedError);
        }

        return Result<CreatePostResponse>.Success(new CreatePostResponse { PostId = postId });
    }

    /// <inheritdoc/>
    public async Task<Result> DiscardDraftAsync(string postId, string userId, CancellationToken ct)
    {
        if (!Guid.TryParse(userId, out var userGuid))
            return Result.BadRequest("Invalid user identifier.");

        var post = await context.Posts.FirstOrDefaultAsync(
            p => p.Id == postId && p.UserId == userGuid,
            ct
        );

        if (post is null)
            return Result.NotFound("Draft post not found.");

        if (!post.IsDraft)
            return Result.BadRequest("Only draft posts can be discarded.");

        var prefix = mediaStorageService.BuildPostMediaPrefix(userId, postId);
        var storageResult = await mediaStorageService.DeleteByPrefixAsync(prefix, ct);
        if (!storageResult.IsSuccess)
        {
            logger.LogError(
                "Failed to delete storage objects for draft {PostId} (prefix '{Prefix}'). "
                    + "Aborting discard to avoid orphaned media.",
                postId,
                prefix
            );
            return Result.InternalServerError("Failed to delete draft media. Please try again.");
        }

        context.Posts.Remove(post);

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Failed to remove draft post {PostId} from database", postId);
            return Result.InternalServerError(ErrorMessages.UnexpectedError);
        }

        return Result.NoContent();
    }
}
