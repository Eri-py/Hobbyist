namespace Hobbyist.Api.Data.Entities;

public class HobbyEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }

    // Navigation properties
    public ICollection<UserEntity> Users { get; set; } = [];
}
