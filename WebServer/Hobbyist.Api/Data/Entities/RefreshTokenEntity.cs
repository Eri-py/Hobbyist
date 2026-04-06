using System.ComponentModel.DataAnnotations.Schema;

namespace Hobbyist.Api.Data.Entities;

public class RefreshTokenEntity
{
    public Guid Id { get; set; }
    public required string TokenHash { get; set; }
    public required DateTimeOffset TokenExpiresAt { get; set; }
    public required DateTimeOffset CreatedAt { get; set; }

    [ForeignKey("User")]
    public required Guid UserId { get; set; }

    // Navigation property
    public UserEntity? User { get; set; }
}
