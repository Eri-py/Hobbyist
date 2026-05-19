using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
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

        if (request.AvailableForTrade && string.IsNullOrWhiteSpace(request.LookingFor))
            return Result<CreateDraftResponse>.BadRequest(
                "Please describe what you're looking for."
            );

        var postId = SlugGenerator.Generate();
        var uploadedKeys = new List<string>(request.Media.Length);

        foreach (var file in request.Media)
        {
            var mediaId = Guid.NewGuid();
            var objectKey = mediaStorageService.BuildDraftMediaObjectKey(
                userId,
                postId,
                mediaId,
                file.FileName
            );

            await using var stream = file.OpenReadStream();
            var uploadResult = await mediaStorageService.UploadAsync(
                new UploadMediaRequest
                {
                    Content = stream,
                    ObjectKey = objectKey,
                    FileName = file.FileName,
                    ContentType = file.ContentType,
                    ContentLength = file.Length,
                },
                ct
            );

            if (!uploadResult.IsSuccess)
            {
                await PostHelpers.CleanupUploadedObjectsAsync(
                    uploadedKeys,
                    mediaStorageService,
                    logger,
                    ct
                );
                return Result<CreateDraftResponse>.FromError(uploadResult);
            }

            uploadedKeys.Add(objectKey);
        }

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
                ExpiresAt = null,
                CreatedAt = DateTimeOffset.UtcNow,
                Likes = 0,
            }
        );

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Failed to persist draft post {PostId} for user {UserId}",
                postId,
                userId
            );
            await PostHelpers.CleanupUploadedObjectsAsync(
                uploadedKeys,
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

        if (post.MediaCount == 0)
            return Result<CreatePostResponse>.BadRequest(
                "At least one media file is required before publishing."
            );

        if (post.AvailableForTrade && string.IsNullOrWhiteSpace(post.LookingFor))
            return Result<CreatePostResponse>.BadRequest(
                "Please describe what you're looking for."
            );

        post.IsDraft = false;
        post.ExpiresAt = null;

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
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
            logger.LogWarning(
                "Storage cleanup failed for draft {PostId} (prefix '{Prefix}'). "
                    + "Objects will be removed by the scheduled expiry job.",
                postId,
                prefix
            );
        }

        context.Posts.Remove(post);

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to remove draft post {PostId} from database", postId);
            return Result.InternalServerError(ErrorMessages.UnexpectedError);
        }

        return Result.NoContent();
    }
}
