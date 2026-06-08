using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Common;

namespace Hobbyist.Api.Extensions.ServiceRegistrations.InfrastructureServices;

public static class CacheServicesRegistration
{
    public static void AddCacheServices(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var raw =
            configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException(
                "Missing 'ConnectionStrings:Redis' configuration."
            );

        var redisConnectionString = NormalizeConnectionString.NormalizeRedis(raw);

        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "hobbyist:";
        });

        services.AddScoped<ICacheService, RedisCacheService>();
    }
}
