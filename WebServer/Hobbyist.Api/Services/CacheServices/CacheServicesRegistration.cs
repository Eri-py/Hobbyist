namespace Hobbyist.Api.Services.CacheServices;

public static class CacheServicesRegistration
{
    public static void AddCacheServices(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var redisConnectionString =
            configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException(
                "Missing 'ConnectionStrings:Redis' configuration."
            );

        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = "hobbyist:";
        });

        services.AddScoped<ICache, RedisCache>();
    }
}
