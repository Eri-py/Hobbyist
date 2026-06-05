using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.Posts;

public record class CreatePostResponse
{
    [Required]
    public required string PostId { get; set; }
}
