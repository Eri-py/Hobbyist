namespace Hobbyist.Api.Services.PostServices.PostDraftServices;

/// <summary>
/// Compile-time constants that govern draft post behaviour.
/// </summary>
public static class PostDraftConfig
{
    /// <summary>
    /// How many days a draft survives before it is eligible for cleanup.
    /// </summary>
    public const int DraftLifetimeDays = 90;

    /// <summary>
    /// Maximum number of media files allowed per post, enforced at upload and publish time.
    /// Must stay in sync with MAX_FILES on the mobile client.
    /// </summary>
    public const int MaxMediaFiles = 15;

    /// <summary>Maximum size in bytes for a single media file (50 MB).</summary>
    public const long MaxFileSizeBytes = 50L * 1024 * 1024;

    /// <summary>Maximum combined size in bytes for all media files in one request (100 MB).</summary>
    public const long MaxTotalSizeBytes = 100L * 1024 * 1024;
}
