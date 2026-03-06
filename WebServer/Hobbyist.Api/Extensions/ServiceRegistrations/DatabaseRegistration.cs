using Hobbyist.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Extensions.ServiceRegistrations;

public static class DatabaseRegistration
{
    public static void AddDatabases(this IServiceCollection services, IConfiguration configs)
    {
        var raw =
            configs.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Missing 'ConnectionStrings:DefaultConnection' configuration."
            );

        string connectionString;
        if (raw.StartsWith("postgres://") || raw.StartsWith("postgresql://"))
        {
            var uri = new Uri(raw);
            var userInfo = uri.UserInfo.Split(':');
            connectionString =
                $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};";
        }
        else
        {
            connectionString = raw;
        }

        services.AddDbContext<HobbyistDbContext>(options => options.UseNpgsql(connectionString));
    }
}
