using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Data.Entities.PostEntities;
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
    public DbSet<PostMediaEntity> PostMedia { get; set; }

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

        // One-to-many: Post <-> PostMedia. Deleting a post removes its media rows.
        builder
            .Entity<PostEntity>()
            .HasMany(p => p.Media)
            .WithOne(m => m.Post)
            .HasForeignKey(m => m.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        // Non-unique: Position is a mutable display order and may shift or briefly collide during edits.
        builder.Entity<PostMediaEntity>().HasIndex(m => new { m.PostId, m.Position });
    }
}
