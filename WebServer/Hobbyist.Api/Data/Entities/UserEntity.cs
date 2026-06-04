using Hobbyist.Api.Data.Entities.PostEntities;

namespace Hobbyist.Api.Data.Entities;

public class UserEntity
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }

    public required string PasswordHash { get; set; }
    public required string Firstname { get; set; }
    public required string Lastname { get; set; }
    public required DateOnly DateOfBirth { get; set; }
    public required DateTimeOffset CreatedAt { get; set; }

    // Navigation properties
    public ICollection<RefreshTokenEntity> RefreshTokens { get; set; } = [];
    public ICollection<HobbyEntity> Hobbies { get; set; } = [];
    public ICollection<PostEntity> Posts { get; set; } = [];
}
