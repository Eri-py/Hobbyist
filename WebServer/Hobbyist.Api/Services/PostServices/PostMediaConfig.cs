namespace Hobbyist.Api.Services.PostServices;

/// <summary>
/// Compile-time limits that govern post media. The count/size limits must stay in sync with the
/// clients (see MAX_FILES / MAX_FILE_SIZE / MAX_TOTAL_SIZE).
/// </summary>
public static class PostMediaConfig
{
    /// <summary>How many days a draft survives before it is eligible for cleanup.</summary>
    public const int DraftLifetimeDays = 90;

    /// <summary>
    /// How long a pre-signed upload URL stays valid. Sized to comfortably outlast a single upload
    /// session — including a max-size post on a slow connection — so the client never needs fresh
    /// URLs mid-session. If a session is interrupted for longer than this, the client recreates the
    /// post rather than resuming.
    /// </summary>
    public const int UploadUrlLifetimeMinutes = 15;

    /// <summary>
    /// Maximum number of media files allowed per post, enforced at init and publish time.
    /// </summary>
    public const int MaxMediaFiles = 15;

    /// <summary>Maximum size in bytes for a single media file (50 MB).</summary>
    public const long MaxFileSizeBytes = 50L * 1024 * 1024;

    /// <summary>Maximum combined size in bytes for all media files in one request (100 MB).</summary>
    public const long MaxTotalSizeBytes = 100L * 1024 * 1024;
}
