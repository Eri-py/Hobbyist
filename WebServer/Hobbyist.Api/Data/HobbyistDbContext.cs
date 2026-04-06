using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Data.Seeds;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Data;

public class HobbyistDbContext(DbContextOptions<HobbyistDbContext> options) : DbContext(options)
{
    // Add tables
    public DbSet<UserEntity> Users { get; set; }
    public DbSet<RefreshTokenEntity> RefreshTokens { get; set; }
    public DbSet<HobbyEntity> Hobbies { get; set; }
    public DbSet<PostEntity> Posts { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Ensure username and email on users table are unique.
        builder.Entity<UserEntity>().HasIndex(u => u.Email).IsUnique();
        builder.Entity<UserEntity>().HasIndex(u => u.Username).IsUnique();

        builder.Entity<HobbyEntity>().HasData(HobbySeedData.Hobbies);

        // Many-to-many: Users <-> Hobbies
        builder
            .Entity<UserEntity>()
            .HasMany(u => u.Hobbies)
            .WithMany(h => h.Users)
            .UsingEntity("UserHobbies");

        builder
            .Entity<UserEntity>()
            .HasMany(u => u.Posts)
            .WithOne(p => p.User)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
