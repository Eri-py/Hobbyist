using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.MediaStorageServices;
using Hobbyist.Api.Services.PostServices.PostDraftServices;

namespace Hobbyist.Api.Services.PostServices;

internal static class PostHelpers
{
    internal static string? ValidateMedia(IFormFile[] media)
    {
        if (media.Length == 0)
            return "At least one media file is required.";

        if (media.Any(f => f.Length <= 0))
            return "Uploaded files must not be empty.";

        if (media.Length > PostDraftConfig.MaxMediaFiles)
            return $"A post can contain at most {PostDraftConfig.MaxMediaFiles} media files.";

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
