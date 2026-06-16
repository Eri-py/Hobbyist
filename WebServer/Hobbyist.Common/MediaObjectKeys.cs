namespace Hobbyist.Common;

// Single source of truth for media object keys: {userId}/{postId}/{mediaId}{ext}. Keyed by stable
// mediaId (not display position) so files reorder without renaming storage.
public static class MediaObjectKeys
{
    /// <summary>Builds the storage object key for one media file of a post.</summary>
    public static string BuildObjectKey(
        string userId,
        string postId,
        Guid mediaId,
        string fileExtension
    )
    {
        if (mediaId == Guid.Empty)
            throw new ArgumentException("Media id must not be empty.", nameof(mediaId));

        var safeExtension = string.IsNullOrWhiteSpace(fileExtension) ? string.Empty : fileExtension;
        return $"{userId}/{postId}/{mediaId:N}{safeExtension}";
    }

    /// <summary>Shared key prefix for a post's media — scopes ownership and bulk deletes.</summary>
    public static string BuildPostMediaPrefix(string userId, string postId) =>
        $"{userId}/{postId}/";
}
