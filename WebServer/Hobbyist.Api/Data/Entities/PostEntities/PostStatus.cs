namespace Hobbyist.Api.Data.Entities.PostEntities;

/// <summary>Lifecycle of a post.</summary>
public enum PostStatus
{
    /// <summary>Saved for later; intentionally incomplete. Not shown publicly.</summary>
    Draft = 0,

    /// <summary>Publish requested; media is uploading. Flips to Published once all media lands.</summary>
    Uploading = 1,

    /// <summary>Live and visible.</summary>
    Published = 2,

    /// <summary>Upload never completed within the allowed window; media has been cleaned up.</summary>
    Failed = 3,
}
