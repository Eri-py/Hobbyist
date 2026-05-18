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
        IFormFile[] media,
        string userId,
        CancellationToken ct
    )
    {
        var mediaError = PostHelpers.ValidateMedia(media);
        if (mediaError is not null)
            return Result<CreateDraftResponse>.BadRequest(mediaError);

        if (!Guid.TryParse(userId, out var userGuid))
            return Result<CreateDraftResponse>.BadRequest("Invalid user identifier.");

        // Generate the post slug upfront so every object key is scoped to this draft.
        var postId = SlugGenerator.Generate();
        var uploadedKeys = new List<string>(media.Length);

        // Upload every file before touching the database.
        // On the first failure, roll back all previously successful uploads.
        foreach (var file in media)
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

        // All uploads succeeded — persist the draft post.
        context.Posts.Add(
            new PostEntity
            {
                Id = postId,
                UserId = userGuid,
                IsDraft = true,
                MediaCount = media.Length,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(PostDraftConfig.DraftLifetimeDays),
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

        return Result<CreateDraftResponse>.Success(
            new CreateDraftResponse { PostId = postId, MediaObjectKeys = [.. uploadedKeys] }
        );
    }

    /// <inheritdoc/>
    public async Task<Result<AddDraftMediaResponse>> AddMediaAsync(
        string postId,
        IFormFile file,
        string userId,
        CancellationToken ct
    )
    {
        if (file.Length <= 0)
            return Result<AddDraftMediaResponse>.BadRequest("Uploaded file must not be empty.");

        if (!Guid.TryParse(userId, out var userGuid))
            return Result<AddDraftMediaResponse>.BadRequest("Invalid user identifier.");

        var post = await context.Posts.FirstOrDefaultAsync(
            p => p.Id == postId && p.UserId == userGuid,
            ct
        );

        if (post is null)
            return Result<AddDraftMediaResponse>.NotFound("Draft post not found.");

        if (!post.IsDraft)
            return Result<AddDraftMediaResponse>.BadRequest(
                "Media can only be added to draft posts."
            );

        if (post.MediaCount >= PostDraftConfig.MaxMediaFiles)
            return Result<AddDraftMediaResponse>.BadRequest(
                $"A post can contain at most {PostDraftConfig.MaxMediaFiles} media files."
            );

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
            return Result<AddDraftMediaResponse>.FromError(uploadResult);

        post.MediaCount++;

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Failed to update MediaCount for draft {PostId} after adding media",
                postId
            );
            await mediaStorageService.DeleteAsync(objectKey, ct);
            return Result<AddDraftMediaResponse>.InternalServerError(ErrorMessages.UnexpectedError);
        }

        return Result<AddDraftMediaResponse>.Success(
            new AddDraftMediaResponse { ObjectKey = objectKey }
        );
    }

    /// <inheritdoc/>
    public async Task<Result> RemoveMediaAsync(
        string postId,
        string objectKey,
        string userId,
        CancellationToken ct
    )
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
            return Result.BadRequest("Media can only be removed from draft posts.");

        // Validate the key belongs to this post before touching S3.
        var expectedPrefix = mediaStorageService.BuildPostMediaPrefix(userId, postId);
        if (!objectKey.StartsWith(expectedPrefix, StringComparison.Ordinal))
            return Result.BadRequest("The specified media does not belong to this post.");

        var deleteResult = await mediaStorageService.DeleteAsync(objectKey, ct);
        if (!deleteResult.IsSuccess)
            return deleteResult;

        post.MediaCount--;

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Failed to update MediaCount for draft {PostId} after removing media",
                postId
            );
            return Result.InternalServerError(ErrorMessages.UnexpectedError);
        }

        return Result.NoContent();
    }

    /// <inheritdoc/>
    public async Task<Result<CreatePostResponse>> PublishDraftAsync(
        string postId,
        PublishPostRequest request,
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

        if (request.AvailableForTrade && string.IsNullOrWhiteSpace(request.LookingFor))
            return Result<CreatePostResponse>.BadRequest(
                "Please describe what you're looking for."
            );

        post.Hobby = request.Hobby;
        post.Title = request.Title;
        post.Description = request.Description;
        post.AvailableForTrade = request.AvailableForTrade;
        post.LookingFor = request.LookingFor;
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

        // Best-effort S3 cleanup — log failures but do not block the discard.
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
