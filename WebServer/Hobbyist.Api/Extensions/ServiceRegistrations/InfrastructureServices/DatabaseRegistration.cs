using Hobbyist.Api.Data;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Extensions.ServiceRegistrations.InfrastructureServices;

public static class DatabaseRegistration
{
    public static string GetDatabaseConnectionString(this IConfiguration configs)
    {
        var raw =
            configs.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Missing 'ConnectionStrings:DefaultConnection' configuration."
            );

        return DatabaseConnectionString.Normalize(raw);
    }

    public static void AddDatabases(this IServiceCollection services, IConfiguration configs)
    {
        var connectionString = configs.GetDatabaseConnectionString();

        services.AddDbContext<HobbyistDbContext>(options => options.UseNpgsql(connectionString));
    }
}
