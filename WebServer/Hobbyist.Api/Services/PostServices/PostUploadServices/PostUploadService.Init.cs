using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.PostUploadServices;

public partial class PostUploadService
{
    public async Task<Result<InitPostResponse>> InitAsync(
        InitPostRequest request,
        string userId,
        CancellationToken ct
    )
    {
        var media = request.Media;

        var manifestError = PostHelpers.ValidateManifest(media, _allowedContentTypes);
        if (manifestError is not null)
            return Result<InitPostResponse>.BadRequest(manifestError);

        if (!Guid.TryParse(userId, out var userGuid))
            return Result<InitPostResponse>.BadRequest("Invalid user identifier.");

        // Server-owned identifiers/timestamps generated once so all writes stay consistent.
        var slug = SlugGenerator.Generate();

        // Always born a Draft, whether the user pressed Post or Save draft; finalize decides if it
        // becomes Published. The publish-vs-draft intent isn't stored — the client supplies it at finalize.
        var post = new PostEntity
        {
            Id = slug,
            UserId = userGuid,
            Hobby = request.Hobby,
            Title = request.Title,
            Description = request.Description,
            AvailableForTrade = request.AvailableForTrade,
            LookingFor = request.LookingFor,
            CreatedAt = DateTimeOffset.UtcNow,
            Status = PostStatus.Draft,
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
