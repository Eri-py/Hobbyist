namespace Hobbyist.Api.Services.PostServices;

/// <summary>Compile-time media limits; count/size must stay in sync with the clients (MAX_FILES etc.).</summary>
public static class PostMediaConfig
{
    /// <summary>How many days a draft survives before it is eligible for cleanup.</summary>
    public const int DraftLifetimeDays = 90;

    /// <summary>Pre-signed upload URL validity; sized to outlast one upload session so URLs never expire mid-session.</summary>
    public const int UploadUrlLifetimeMinutes = 15;

    /// <summary>Max media files per post, enforced at init and publish.</summary>
    public const int MaxMediaFiles = 15;

    /// <summary>Maximum size in bytes for a single media file (50 MB).</summary>
    public const long MaxFileSizeBytes = 50L * 1024 * 1024;

    /// <summary>Maximum combined size in bytes for all media files in one request (100 MB).</summary>
    public const long MaxTotalSizeBytes = 100L * 1024 * 1024;
}
