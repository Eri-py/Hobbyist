namespace Hobbyist.Api.Data.Entities.PostEntities;

/// <summary>
/// Lifecycle of a post. Status is about user intent, not byte-transfer progress — whether the
/// media has landed is tracked per file by <see cref="PostMediaStatus"/>. A post is born Draft
/// (whether the user pressed Post or Save draft) and only becomes Published when finalize verifies
/// every file is in storage and the caller asked to publish.
/// </summary>
public enum PostStatus
{
    /// <summary>Not live. Either a user-saved draft or a publish whose media hasn't all landed yet.</summary>
    Draft = 0,

    /// <summary>Live and visible. Set by finalize once all media is verified.</summary>
    Published = 1,
}
