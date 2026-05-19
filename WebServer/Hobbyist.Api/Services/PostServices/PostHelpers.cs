using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.MediaStorageServices;
using Hobbyist.Api.Services.PostServices.PostDraftServices;

namespace Hobbyist.Api.Services.PostServices;

internal static class PostHelpers
{
    internal static string? ValidateDraftForPublish(PostEntity post)
    {
        if (post.MediaCount == 0)
            return "At least one media file is required before publishing.";

        if (string.IsNullOrWhiteSpace(post.Hobby))
            return "Hobby is required before publishing.";

        if (string.IsNullOrWhiteSpace(post.Title))
            return "Title is required before publishing.";

        if (string.IsNullOrWhiteSpace(post.Description))
            return "Description is required before publishing.";

        if (post.Description.Trim().Length < 10)
            return "Description must be at least 10 characters.";

        if (post.AvailableForTrade && string.IsNullOrWhiteSpace(post.LookingFor))
            return "Please describe what you're looking for.";

        return null;
    }

    internal static string? ValidateMedia(IFormFile[] media)
    {
        if (media.Length == 0)
            return "At least one media file is required.";

        if (media.Any(f => f.Length <= 0))
            return "Uploaded files must not be empty.";

        if (media.Length > PostDraftConfig.MaxMediaFiles)
            return $"A post can contain at most {PostDraftConfig.MaxMediaFiles} media files.";

        var oversized = media.FirstOrDefault(f => f.Length > PostDraftConfig.MaxFileSizeBytes);
        if (oversized is not null)
            return $"\"{oversized.FileName}\" exceeds the {PostDraftConfig.MaxFileSizeBytes / 1024 / 1024} MB per-file limit.";

        var totalSize = media.Sum(f => f.Length);
        if (totalSize > PostDraftConfig.MaxTotalSizeBytes)
            return $"Total upload size exceeds the {PostDraftConfig.MaxTotalSizeBytes / 1024 / 1024} MB limit.";

        return null;
    }

    internal static async Task CleanupUploadedObjectsAsync(
        IEnumerable<string> objectKeys,
        IMediaStorageService mediaStorageService,
        ILogger logger,
        CancellationToken ct
    )
    {
        foreach (var key in objectKeys)
        {
            try
            {
                var result = await mediaStorageService.DeleteAsync(key, ct);
                if (!result.IsSuccess)
                    logger.LogWarning(
                        "Rollback: failed to delete uploaded object '{ObjectKey}'",
                        key.SanitizeForLog()
                    );
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Rollback: unexpected error deleting object '{ObjectKey}'",
                    key.SanitizeForLog()
                );
            }
        }
    }
}
