using System.ComponentModel.DataAnnotations.Schema;

namespace Hobbyist.Api.Data.Entities.PostEntities;

public class PostEntity
{
    public required string Id { get; set; }

    [ForeignKey("User")]
    public required Guid UserId { get; set; }

    /// <summary>Null while the post is a draft; required before publishing.</summary>
    public string? Hobby { get; set; }

    /// <summary>Null while the post is a draft; required before publishing.</summary>
    public string? Title { get; set; }

    /// <summary>Null while the post is a draft; required before publishing.</summary>
    public string? Description { get; set; }

    public bool AvailableForTrade { get; set; }

    public string? LookingFor { get; set; }

    /// <summary>True creation time; never overwritten when a draft is published.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Set when the post first becomes Published; null otherwise.</summary>
    public DateTimeOffset? PublishedAt { get; set; }

    public int Likes { get; set; }

    /// <summary>Lifecycle state. Replaces the old IsDraft flag.</summary>
    public PostStatus Status { get; set; }

    // Navigation properties
    public UserEntity? User { get; set; }
    public ICollection<PostMediaEntity> Media { get; set; } = [];
}
