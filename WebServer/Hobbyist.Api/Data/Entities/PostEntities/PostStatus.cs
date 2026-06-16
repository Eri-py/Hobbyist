namespace Hobbyist.Api.Data.Entities.PostEntities;

/// <summary>Post lifecycle: user intent, not byte progress (that's per-file on <see cref="PostMediaStatus"/>). Born Draft, Published only when finalize verifies all media and the caller asked to publish.</summary>
public enum PostStatus
{
    /// <summary>Not live. Either a user-saved draft or a publish whose media hasn't all landed yet.</summary>
    Draft = 0,

    /// <summary>Live and visible. Set by finalize once all media is verified.</summary>
    Published = 1,
}
