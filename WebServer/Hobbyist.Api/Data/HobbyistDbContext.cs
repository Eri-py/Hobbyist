using Hobbyist.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Data;

public class HobbyistDbContext(DbContextOptions<HobbyistDbContext> options) : DbContext(options)
{
    // Add tables
    public DbSet<UserEntity> Users { get; set; }
    public DbSet<RefreshTokenEntity> RefreshTokens { get; set; }
    public DbSet<HobbyEntity> Hobbies { get; set; }
    public DbSet<SearchEntity> Searches { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Ensure username and email on users table are unique.
        builder.Entity<UserEntity>().HasIndex(u => u.Email).IsUnique();
        builder.Entity<UserEntity>().HasIndex(u => u.Username).IsUnique();

        // Create hobbies table with Pokemon card collecting and flower spotting.
        builder
            .Entity<HobbyEntity>()
            .HasData(
                new HobbyEntity
                {
                    Id = new Guid("360fa3cd-b910-4849-92ac-87ec100124f8"),
                    CategoryName = "Pokemon card collecting",
                },
                new HobbyEntity
                {
                    Id = new Guid("ab1101f5-c1d7-424b-88b1-f39df2367eea"),
                    CategoryName = "Flower spotting",
                }
            );
    }
}
