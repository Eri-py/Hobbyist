using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Services.MediaStorageServices.ObjectStoreServices;
using Hobbyist.Api.Services.MediaStorageServices.UrlSignerServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.PostServices.PostUploadServices;

/// <summary>
/// Orchestrates the media-first upload lifecycle. The public operations live in partial files:
/// <c>PostUploadService.Init.cs</c> (start a publish/draft) and <c>PostUploadService.Finalize.cs</c>
/// (finalize and refresh). This file holds construction and the helpers they share.
/// </summary>
public partial class PostUploadService(
    IMediaUrlSignerService urlSigner,
    IMediaObjectStoreService objectStore,
    HobbyistDbContext context,
    IConfiguration configuration,
    ILogger<PostUploadService> logger
) : IPostUploadService
{
    private readonly HashSet<string> _allowedContentTypes = LoadAllowedContentTypes(configuration);

    /// <summary>Loads a post with its media, scoped to the owning user (null if not found or not owned).</summary>
    private Task<PostEntity?> LoadOwnedPostAsync(
        string slug,
        Guid userGuid,
        CancellationToken ct
    ) =>
        context
            .Posts.Include(p => p.Media)
            .FirstOrDefaultAsync(p => p.Id == slug && p.UserId == userGuid, ct);

    /// <summary>Signs an upload URL for one media file and shapes it into a <see cref="PresignedUpload"/>.</summary>
    private async Task<Result<PresignedUpload>> BuildUploadAsync(
        string userId,
        string slug,
        Guid mediaId,
        int position,
        string contentType,
        string extension,
        CancellationToken ct
    )
    {
        var objectKey = MediaObjectKeys.BuildObjectKey(userId, slug, mediaId, extension);

        var presignResult = await urlSigner.CreateUploadUrlAsync(
            objectKey,
            contentType,
            ttl: TimeSpan.FromMinutes(PostMediaConfig.UploadUrlLifetimeMinutes),
            ct
        );
        if (!presignResult.IsSuccess)
            return Result<PresignedUpload>.FromError(presignResult);

        var presigned = presignResult.Content!;
        return Result<PresignedUpload>.Success(
            new PresignedUpload
            {
                Position = position,
                Url = presigned.Url,
                RequiredHeaders = presigned.RequiredHeaders,
                ExpiresAt = presigned.ExpiresAt,
            }
        );
    }

    private static HashSet<string> LoadAllowedContentTypes(IConfiguration configuration)
    {
        var types = configuration.GetSection("PostMedia:AllowedContentTypes").Get<string[]>();
        if (types is null || types.Length == 0)
            throw new InvalidOperationException(
                "Missing 'PostMedia:AllowedContentTypes' configuration."
            );

        return new HashSet<string>(types, StringComparer.OrdinalIgnoreCase);
    }
}
