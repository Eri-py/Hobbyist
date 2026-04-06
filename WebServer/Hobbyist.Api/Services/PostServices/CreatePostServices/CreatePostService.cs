using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Services.MediaStorageServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.PostServices.CreatePostServices;

public class CreatePostService(
    IMediaStorageService mediaStorageService,
    HobbyistDbContext context,
    ILogger<CreatePostService> logger
) : ICreatePostService
{
    public async Task<Result<CreatePostResponse>> CreatePostAsync(
        CreatePostRequest request,
        string userId,
        CancellationToken ct
    )
    {
        if (request.Media.Length == 0)
            return Result<CreatePostResponse>.BadRequest("At least one media file is required.");

        if (request.Media.Any(file => file.Length <= 0))
            return Result<CreatePostResponse>.BadRequest("Uploaded files must not be empty.");

        if (!Guid.TryParse(userId, out var userGuid))
            return Result<CreatePostResponse>.BadRequest("Invalid user identifier.");

        // Generate server-owned identifiers/timestamps once so all writes stay consistent.
        var postId = Guid.NewGuid();
        var createdAt = DateTimeOffset.UtcNow;

        // Keep uploaded keys for compensation if DB persistence fails later.
        var uploadedObjectKeys = new List<string>(request.Media.Length);
        var mediaStoreResult = await StorePostMediaAsync(
            request.Media,
            userId,
            postId,
            uploadedObjectKeys,
            ct
        );
        if (!mediaStoreResult.IsSuccess)
            return Result<CreatePostResponse>.FromError(mediaStoreResult);

        // Persist post metadata only after media is safely stored.
        var postStoreResult = await StorePostDetailsAsync(request, userGuid, postId, createdAt, ct);
        if (!postStoreResult.IsSuccess)
        {
            // Best-effort rollback to avoid orphaned media objects.
            await CleanupUploadedMediaAsync(uploadedObjectKeys, ct);
            return Result<CreatePostResponse>.FromError(postStoreResult);
        }

        return Result<CreatePostResponse>.Success(new CreatePostResponse { PostId = postId });
    }

    public async Task<Result> StorePostMediaAsync(
        IFormFile[] media,
        string userId,
        Guid postId,
        ICollection<string> uploadedObjectKeys,
        CancellationToken ct
    )
    {
        for (var i = 0; i < media.Length; i++)
        {
            var file = media[i];
            var objectKey = mediaStorageService.BuildObjectKey(
                userId,
                postId,
                i + 1,
                file.FileName
            );

            await using var contentStream = file.OpenReadStream();
            var uploadResult = await mediaStorageService.UploadAsync(
                new UploadMediaRequest
                {
                    Content = contentStream,
                    ObjectKey = objectKey,
                    FileName = file.FileName,
                    ContentType = file.ContentType,
                    ContentLength = file.Length,
                },
                ct
            );
            if (!uploadResult.IsSuccess)
            {
                // Upload failed mid-batch: cleanup anything that was already uploaded.
                await CleanupUploadedMediaAsync(uploadedObjectKeys, ct);
                return uploadResult.ResultType switch
                {
                    ResultTypes.BadRequest => Result.BadRequest(
                        uploadResult.Message ?? string.Empty
                    ),
                    ResultTypes.Unauthorized => Result.Unauthorized(
                        uploadResult.Message ?? string.Empty
                    ),
                    ResultTypes.NotFound => Result.NotFound(uploadResult.Message ?? string.Empty),
                    ResultTypes.Conflict => Result.Conflict(uploadResult.Message ?? string.Empty),
                    ResultTypes.TooManyRequests => Result.TooManyRequests(
                        uploadResult.Message ?? string.Empty
                    ),
                    _ => Result.InternalServerError(
                        uploadResult.Message ?? ErrorMessages.UnexpectedError
                    ),
                };
            }

            var uploadedMedia = uploadResult.Content!;
            // Track immediately so rollback includes this file if URL generation fails.
            uploadedObjectKeys.Add(uploadedMedia.ObjectKey);
        }

        return Result.NoContent();
    }

    public async Task<Result> StorePostDetailsAsync(
        CreatePostRequest request,
        Guid userId,
        Guid postId,
        DateTimeOffset createdAt,
        CancellationToken ct
    )
    {
        context.Posts.Add(
            new PostEntity
            {
                Id = postId,
                UserId = userId,
                Hobby = request.Hobby,
                Title = request.Title,
                Description = request.Description,
                AvailableForTrade = request.AvailableForTrade,
                LookingFor = request.LookingFor,
                CreatedAt = createdAt,
                Likes = 0,
            }
        );

        try
        {
            await context.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(
                ex,
                "Failed to persist post {PostId} for user {UserId} after media upload",
                postId,
                userId
            );

            return Result.InternalServerError("Failed to create post. Please try again.");
        }

        return Result.NoContent();
    }

    private async Task CleanupUploadedMediaAsync(
        IEnumerable<string> objectKeys,
        CancellationToken ct
    )
    {
        // Cleanup is best-effort: log and continue so one delete failure does not block others.
        foreach (var objectKey in objectKeys)
        {
            try
            {
                var deleteResult = await mediaStorageService.DeleteAsync(objectKey, ct);
                if (!deleteResult.IsSuccess)
                {
                    logger.LogWarning(
                        "Failed to rollback uploaded media object '{ObjectKey}'. ResultType: {ResultType}",
                        objectKey,
                        deleteResult.ResultType
                    );
                }
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Unexpected error while rolling back uploaded media object '{ObjectKey}'",
                    objectKey
                );
            }
        }
    }
}
