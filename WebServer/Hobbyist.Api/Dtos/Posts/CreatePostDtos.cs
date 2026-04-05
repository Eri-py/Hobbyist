using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.Posts;

public record class CreatePostRequest
{
    [Required]
    [MaxLength(100)]
    public required string Hobby { get; set; }

    [Required]
    [MaxLength(150)]
    public required string Title { get; set; }

    [Required]
    [MaxLength(5000)]
    public required string Description { get; set; }

    public required bool AvailableForTrade { get; set; }

    [MaxLength(150)]
    public string? LookingFor { get; set; }

    [Required]
    public required IFormFile[] Media { get; set; }
}

public record class CreatePostResponse
{
    [Required]
    public required Guid PostId { get; set; }

    [Required]
    public required string UserId { get; set; }

    [Required]
    public required string Hobby { get; set; }

    [Required]
    public required string Title { get; set; }

    [Required]
    public required string Description { get; set; }

    public required bool AvailableForTrade { get; set; }

    public string? LookingFor { get; set; }

    [Required]
    public required IReadOnlyCollection<PostMediaReference> Media { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }
}

public record class PostMediaReference
{
    [Required]
    public required string ObjectKey { get; set; }

    [Required]
    public required string Url { get; set; }

    [Required]
    public required string ContentType { get; set; }

    public required long SizeBytes { get; set; }
}
