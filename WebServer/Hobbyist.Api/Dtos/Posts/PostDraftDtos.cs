using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.Posts;

/// <summary>
/// Returned after a draft post is created. The client must persist
/// <see cref="MediaObjectKeys"/> alongside each carousel item so individual
/// files can be removed via the remove-media endpoint.
/// </summary>
public record CreateDraftResponse
{
    [Required]
    public required string PostId { get; set; }

    /// <summary>S3 object keys for every file that was uploaded with this draft.</summary>
    [Required]
    public required string[] MediaObjectKeys { get; set; }
}

/// <summary>
/// Returned after a single media file is added to an existing draft.
/// </summary>
public record AddDraftMediaResponse
{
    /// <summary>S3 object key for the uploaded file.</summary>
    [Required]
    public required string ObjectKey { get; set; }
}

/// <summary>
/// Request body for removing a single media file from a draft carousel.
/// </summary>
public record RemoveDraftMediaRequest
{
    /// <summary>
    /// The exact S3 object key returned when the file was originally uploaded.
    /// The server validates that this key belongs to the target draft before deleting.
    /// </summary>
    [Required]
    public required string ObjectKey { get; set; }
}

/// <summary>
/// Form fields supplied when the user confirms and publishes a draft.
/// </summary>
public record PublishPostRequest
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
}
