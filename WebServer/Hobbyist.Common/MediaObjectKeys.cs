namespace Hobbyist.Common;

/// <summary>
/// Single source of truth for post media storage object keys. The layout
/// <c>{userId}/{postId}/{mediaId}{extension}</c> is relied on by uploads, lookups and
/// prefix-based bulk deletes, so it must only ever be defined here. The key uses the media's
/// stable id (not its display position) so files can be reordered without renaming storage.
/// </summary>
public static class MediaObjectKeys
{
    /// <summary>Builds the storage object key for one media file of a post.</summary>
    /// <param name="mediaId">The media's stable identity.</param>
    /// <param name="fileExtension">Extension including the leading dot (e.g. ".jpg"), or empty for none.</param>
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

    /// <summary>
    /// Returns the shared key prefix for all media belonging to a post. Used to scope ownership
    /// and to bulk-delete a post's objects.
    /// </summary>
    public static string BuildPostMediaPrefix(string userId, string postId) =>
        $"{userId}/{postId}/";
}
