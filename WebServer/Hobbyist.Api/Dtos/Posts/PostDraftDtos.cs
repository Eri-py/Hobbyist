using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.Posts;

/// <summary>
/// Multipart form request to save a post as a draft. Only <see cref="Media"/>
/// is required — all form fields are optional so the user can save a draft at
/// any point and fill in the remaining details before publishing.
/// </summary>
public record SaveDraftRequest
{
    [MaxLength(50)]
    public string? Hobby { get; set; }

    [MaxLength(100)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public bool AvailableForTrade { get; set; }

    [MaxLength(500)]
    public string? LookingFor { get; set; }

    [Required]
    public required IFormFile[] Media { get; set; }
}

/// <summary>
/// Returned after a draft post is successfully created.
/// </summary>
public record CreateDraftResponse
{
    [Required]
    public required string PostId { get; set; }
}
