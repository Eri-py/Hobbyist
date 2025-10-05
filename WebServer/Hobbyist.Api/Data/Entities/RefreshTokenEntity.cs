using System.ComponentModel.DataAnnotations.Schema;

namespace Hobbyist.Api.Data.Entities;

public class RefreshTokenEntity
{
    public Guid Id { get; set; }
    public required string TokenHash { get; set; }
    public required DateTime TokenExpiresAt { get; set; }

    [ForeignKey("User")]
    public required Guid UserId { get; set; }

    // Navigation property
    public UserEntity? User { get; set; }
}
