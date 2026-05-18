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
}
