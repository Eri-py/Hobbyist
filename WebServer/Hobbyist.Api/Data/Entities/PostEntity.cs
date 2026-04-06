using System.ComponentModel.DataAnnotations.Schema;

namespace Hobbyist.Api.Data.Entities;

public class PostEntity
{
    public Guid Id { get; set; }

    [ForeignKey("User")]
    public required Guid UserId { get; set; }

    public required string Hobby { get; set; }

    public required string Title { get; set; }

    public required string Description { get; set; }

    public bool AvailableForTrade { get; set; }

    public string? LookingFor { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public int Likes { get; set; }

    // Navigation property
    public UserEntity? User { get; set; }
}
