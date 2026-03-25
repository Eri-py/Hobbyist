using Hobbyist.Api.Services.CacheServices;

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

        string redisConnectionString;
        if (raw.StartsWith("redis://") || raw.StartsWith("rediss://"))
        {
            var uri = new Uri(raw);
            var password = uri.UserInfo.Split(':')[1];
            var isSsl = raw.StartsWith("rediss://");
            redisConnectionString = $"{uri.Host}:{uri.Port},password={password},ssl={isSsl}";
        }
        else
        {
            redisConnectionString = raw;
        }

        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "hobbyist:";
        });

        services.AddScoped<ICache, RedisCache>();
    }
}
