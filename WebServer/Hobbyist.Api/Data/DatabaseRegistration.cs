using System;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Data;

public static class DatabaseRegistration
{
    public static void AddDatabases(this IServiceCollection services, IConfiguration configs)
    {
        var connectionString = configs.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Missing 'ConnectionStrings:DefaultConnection' configuration."
            );
        }

        services.AddDbContext<HobbyistDbContext>(options => options.UseNpgsql(connectionString));
    }
}
