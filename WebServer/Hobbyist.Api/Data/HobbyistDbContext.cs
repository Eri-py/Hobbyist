using Hobbyist.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Data;

public class HobbyistDbContext(DbContextOptions<HobbyistDbContext> options) : DbContext(options)
{
    // Add tables
    public DbSet<UserEntity> Users { get; set; }
    public DbSet<RefreshTokenEntity> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Ensure username and email on users table are unique.
        builder.Entity<UserEntity>().HasIndex(u => u.Email).IsUnique();
        builder.Entity<UserEntity>().HasIndex(u => u.Username).IsUnique();
    }
}
