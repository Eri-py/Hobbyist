namespace Hobbyist.Api.Data.Entities.PostEntities;

/// <summary>Upload state of a single media file belonging to a post.</summary>
public enum PostMediaStatus
{
    /// <summary>A presigned upload URL was issued but the object has not been verified in storage yet.</summary>
    Pending = 0,

    /// <summary>The object was confirmed present in storage at finalize.</summary>
    Uploaded = 1,
}
