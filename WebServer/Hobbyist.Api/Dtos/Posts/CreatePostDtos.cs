using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.Posts;

public record class CreatePostRequest
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

public record class CreatePostResponse
{
    [Required]
    public required string PostId { get; set; }
}
