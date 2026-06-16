using Hobbyist.Api.Data.Entities.PostEntities;
using Hobbyist.Api.Dtos.Posts;

namespace Hobbyist.Api.Services.PostServices;

internal static class PostHelpers
{
    internal static string? ValidateDraftForPublish(PostEntity post, int uploadedMediaCount)
    {
        if (uploadedMediaCount == 0)
            return "At least one media file is required before publishing.";

        if (string.IsNullOrWhiteSpace(post.Hobby))
            return "Hobby is required before publishing.";

        if (post.Hobby.Trim().Length < 2)
            return "Hobby must be at least 2 characters.";

        if (string.IsNullOrWhiteSpace(post.Title))
            return "Title is required before publishing.";

        if (post.Title.Trim().Length < 3)
            return "Title must be at least 3 characters.";

        if (string.IsNullOrWhiteSpace(post.Description))
            return "Description is required before publishing.";

        if (post.Description.Trim().Length < 10)
            return "Description must be at least 10 characters.";

        if (post.AvailableForTrade && string.IsNullOrWhiteSpace(post.LookingFor))
            return "Please describe what you're looking for.";

        return null;
    }

    /// <summary>Validates the client-declared manifest (metadata only — no bytes yet) before signing URLs.</summary>
    internal static string? ValidateManifest(
        IReadOnlyList<MediaManifestItem> media,
        IReadOnlySet<string> allowedContentTypes
    )
    {
        if (media.Count == 0)
            return "At least one media file is required.";

        if (media.Count > PostMediaConfig.MaxMediaFiles)
            return $"A post can contain at most {PostMediaConfig.MaxMediaFiles} media files.";

        if (media.Any(m => m.Position <= 0))
            return "Media position must be greater than zero.";

        if (media.Select(m => m.Position).Distinct().Count() != media.Count)
            return "Each media item must have a unique position.";

        if (media.Any(m => m.ByteSize <= 0))
            return "Uploaded files must not be empty.";

        var oversized = media.FirstOrDefault(m => m.ByteSize > PostMediaConfig.MaxFileSizeBytes);
        if (oversized is not null)
            return $"\"{oversized.FileName}\" exceeds the {PostMediaConfig.MaxFileSizeBytes / 1024 / 1024} MB per-file limit.";

        var totalSize = media.Sum(m => m.ByteSize);
        if (totalSize > PostMediaConfig.MaxTotalSizeBytes)
            return $"Total upload size exceeds the {PostMediaConfig.MaxTotalSizeBytes / 1024 / 1024} MB limit.";

        var unsupported = media.FirstOrDefault(m => !allowedContentTypes.Contains(m.ContentType));
        if (unsupported is not null)
            return $"\"{unsupported.FileName}\" has an unsupported file type.";

        return null;
    }
}
