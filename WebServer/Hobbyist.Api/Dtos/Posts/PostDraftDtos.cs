using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.Posts;

/// <summary>
/// Multipart form request to save a post as a draft. All form fields and media
/// are supplied up-front so the draft is complete and ready to publish later.
/// </summary>
public record SaveDraftRequest
{
    [Required]
    [MaxLength(50)]
    public required string Hobby { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Title { get; set; }

    [Required]
    [MinLength(10)]
    [MaxLength(2000)]
    public required string Description { get; set; }

    public required bool AvailableForTrade { get; set; }

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
