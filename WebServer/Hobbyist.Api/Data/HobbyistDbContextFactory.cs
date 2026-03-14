using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Hobbyist.Api.Data;

public class HobbyistDbContextFactory : IDesignTimeDbContextFactory<HobbyistDbContext>
{
    public HobbyistDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var raw =
            config.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=hobbyist;Username=postgres;Password=postgres;";

        var connectionString = DatabaseConnectionString.Normalize(raw);

        var options = new DbContextOptionsBuilder<HobbyistDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new HobbyistDbContext(options);
    }
}
