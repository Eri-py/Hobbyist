using System.ComponentModel.DataAnnotations.Schema;

namespace Hobbyist.Api.Data.Entities;

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

    public DateTimeOffset CreatedAt { get; set; }

    public int Likes { get; set; }

    /// <summary>True until the user publishes. Published posts always have IsDraft = false.</summary>
    public bool IsDraft { get; set; }

    /// <summary>
    /// Number of media files currently associated with this post.
    /// Incremented on each successful upload, decremented on removal.
    /// Validated to be greater than zero before publishing.
    /// </summary>
    public int MediaCount { get; set; }

    // Navigation property
    public UserEntity? User { get; set; }
}
