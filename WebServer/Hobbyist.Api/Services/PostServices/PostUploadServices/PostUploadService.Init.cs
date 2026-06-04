using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostUploadServices;

public partial class PostUploadService
{
    public async Task<Result<InitPostResponse>> InitPublishAsync(
        InitPublishRequest request,
        string userId,
        CancellationToken ct
    )
    {
        if (request.AvailableForTrade && string.IsNullOrWhiteSpace(request.LookingFor))
            return Result<InitPostResponse>.BadRequest("Please describe what you're looking for.");

        return await InitAsync(
            userId,
            request.Hobby,
            request.Title,
            request.Description,
            request.AvailableForTrade,
            request.LookingFor,
            request.Media,
            PostStatus.Uploading,
            ct
        );
    }

    public async Task<Result<InitPostResponse>> InitDraftAsync(
        InitDraftRequest request,
        string userId,
        CancellationToken ct
    )
    {
        return await InitAsync(
            userId,
            request.Hobby,
            request.Title,
            request.Description,
            request.AvailableForTrade,
            request.LookingFor,
            request.Media,
            PostStatus.Draft,
            ct
        );
    }

    private async Task<Result<InitPostResponse>> InitAsync(
        string userId,
        string? hobby,
        string? title,
        string? description,
        bool availableForTrade,
        string? lookingFor,
        MediaManifestItem[] media,
        PostStatus status,
        CancellationToken ct
    )
    {
        var manifestError = PostHelpers.ValidateManifest(media, _allowedContentTypes);
        if (manifestError is not null)
            return Result<InitPostResponse>.BadRequest(manifestError);

        if (!Guid.TryParse(userId, out var userGuid))
            return Result<InitPostResponse>.BadRequest("Invalid user identifier.");

        // Server-owned identifiers/timestamps generated once so all writes stay consistent.
        var slug = SlugGenerator.Generate();

        var post = new PostEntity
        {
            Id = slug,
            UserId = userGuid,
            Hobby = hobby,
            Title = title,
            Description = description,
            AvailableForTrade = availableForTrade,
            LookingFor = lookingFor,
            CreatedAt = DateTimeOffset.UtcNow,
            Status = status,
            Likes = 0,
        };

        // Sign an upload URL per file and stage a Pending media row for each. Presigning is local
        // (no storage write) and happens before SaveChanges, so a failure leaves nothing persisted
        // and no objects in storage to clean up.
        var uploads = new List<PresignedUpload>(media.Length);
        foreach (var item in media)
        {
            var mediaId = Guid.NewGuid();
            var extension = Path.GetExtension(item.FileName);

            var uploadResult = await BuildUploadAsync(
                userId,
                slug,
                mediaId,
                item.Position,
                item.ContentType,
                extension,
                ct
            );
            if (!uploadResult.IsSuccess)
                return Result<InitPostResponse>.FromError(uploadResult);

            post.Media.Add(
                new PostMediaEntity
                {
                    Id = mediaId,
                    PostId = slug,
                    Position = item.Position,
                    FileExtension = extension,
                    ContentType = item.ContentType,
                    ByteSize = item.ByteSize,
                    Status = PostMediaStatus.Pending,
                }
            );
            uploads.Add(uploadResult.Content!);
        }

        try
        {
            context.Posts.Add(post);
            await context.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Failed to persist init for post {PostId}", slug);
            return Result<InitPostResponse>.InternalServerError(
                "Failed to start the post. Please try again."
            );
        }

        return Result<InitPostResponse>.Success(
            new InitPostResponse { Slug = slug, Uploads = [.. uploads] }
        );
    }
}
