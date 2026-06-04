using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Services.MediaStorageServices;
using Hobbyist.Common;

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
        var mediaError = PostHelpers.ValidateMedia(request.Media);
        if (mediaError is not null)
            return Result<CreatePostResponse>.BadRequest(mediaError);

        if (request.AvailableForTrade && string.IsNullOrWhiteSpace(request.LookingFor))
            return Result<CreatePostResponse>.BadRequest(
                "Please describe what you're looking for."
            );

        if (!Guid.TryParse(userId, out var userGuid))
            return Result<CreatePostResponse>.BadRequest("Invalid user identifier.");

        // Generate server-owned identifiers/timestamps once so all writes stay consistent.
        var postId = SlugGenerator.Generate();
        var createdAt = DateTimeOffset.UtcNow;

        var uploadResult = await PostHelpers.UploadPostMediaAsync(
            request.Media,
            userId,
            postId,
            mediaStorageService,
            logger,
            ct
        );
        if (!uploadResult.IsSuccess)
            return Result<CreatePostResponse>.FromError(uploadResult);

        // Persist post metadata only after media is safely stored.
        var postStoreResult = await StorePostDetailsAsync(request, userGuid, postId, createdAt, ct);
        if (!postStoreResult.IsSuccess)
        {
            // Best-effort rollback to avoid orphaned media objects.
            await PostHelpers.CleanupUploadedObjectsAsync(
                uploadResult.Content!,
                mediaStorageService,
                logger,
                ct
            );
            return Result<CreatePostResponse>.FromError(postStoreResult);
        }

        return Result<CreatePostResponse>.Success(new CreatePostResponse { PostId = postId });
    }

    private async Task<Result> StorePostDetailsAsync(
        CreatePostRequest request,
        Guid userId,
        string postId,
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
                MediaCount = request.Media.Length,
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
                "Failed to persist post {PostId} for user {UserId} after media upload",
                postId,
                userId
            );

            return Result.InternalServerError("Failed to create post. Please try again.");
        }

        return Result.NoContent();
    }
}
