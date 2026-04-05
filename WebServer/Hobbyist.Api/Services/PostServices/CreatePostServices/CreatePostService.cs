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
    private static readonly TimeSpan ReadUrlTtl = TimeSpan.FromMinutes(15);

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

        var postId = Guid.NewGuid();
        var createdAt = DateTimeOffset.UtcNow;

        var mediaStoreResult = await StorePostMediaAsync(request.Media, userId, postId, ct);
        if (!mediaStoreResult.IsSuccess)
            return Result<CreatePostResponse>.FromError(mediaStoreResult);

        var mediaReferences = mediaStoreResult.Content!;

        var postStoreResult = await StorePostDetailsAsync(request, userGuid, postId, createdAt, ct);
        if (!postStoreResult.IsSuccess)
        {
            await CleanupUploadedMediaAsync(
                mediaReferences.Select(reference => reference.ObjectKey),
                ct
            );
            return Result<CreatePostResponse>.FromError(postStoreResult);
        }

        return Result<CreatePostResponse>.Success(
            new CreatePostResponse
            {
                PostId = postId,
                UserId = userId,
                Hobby = request.Hobby,
                Title = request.Title,
                Description = request.Description,
                AvailableForTrade = request.AvailableForTrade,
                LookingFor = request.LookingFor,
                Media = mediaReferences,
                CreatedAt = createdAt,
            }
        );
    }

    public async Task<Result<List<PostMediaReference>>> StorePostMediaAsync(
        IFormFile[] media,
        string userId,
        Guid postId,
        CancellationToken ct
    )
    {
        var uploadedObjectKeys = new List<string>(media.Length);
        var mediaReferences = new List<PostMediaReference>(media.Length);

        foreach (var file in media)
        {
            var mediaReferenceResult = await UploadAndBuildMediaReferenceAsync(
                file,
                userId,
                postId,
                ct
            );
            if (!mediaReferenceResult.IsSuccess)
            {
                await CleanupUploadedMediaAsync(uploadedObjectKeys, ct);
                return Result<List<PostMediaReference>>.FromError(mediaReferenceResult);
            }

            var mediaReference = mediaReferenceResult.Content!;
            uploadedObjectKeys.Add(mediaReference.ObjectKey);
            mediaReferences.Add(mediaReference);
        }

        return Result<List<PostMediaReference>>.Success(mediaReferences);
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

    private async Task<Result<PostMediaReference>> UploadAndBuildMediaReferenceAsync(
        IFormFile file,
        string userId,
        Guid postId,
        CancellationToken ct
    )
    {
        var objectKey = mediaStorageService.BuildObjectKey(userId, postId, file.FileName);

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
            return Result<PostMediaReference>.FromError(uploadResult);

        var uploadedMedia = uploadResult.Content!;
        var readUrlResult = await mediaStorageService.GetReadUrlAsync(
            uploadedMedia.ObjectKey,
            ReadUrlTtl,
            ct
        );

        if (!readUrlResult.IsSuccess)
            return Result<PostMediaReference>.FromError(readUrlResult);

        return Result<PostMediaReference>.Success(
            new PostMediaReference
            {
                ObjectKey = uploadedMedia.ObjectKey,
                Url = readUrlResult.Content!,
                ContentType = uploadedMedia.ContentType,
                SizeBytes = uploadedMedia.SizeBytes,
            }
        );
    }

    private async Task CleanupUploadedMediaAsync(
        IEnumerable<string> objectKeys,
        CancellationToken ct
    )
    {
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
