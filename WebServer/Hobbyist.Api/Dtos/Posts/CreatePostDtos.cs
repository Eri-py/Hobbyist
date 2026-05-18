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
    public required string PostId { get; set; }
}
