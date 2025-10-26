using System;

namespace Hobbyist.Api.Services.CacheServices;

public static class CacheServicesRegistration
{
    public static void AddCacheServices(this IServiceCollection services)
    {
        // Add Memory Cache for now as this is just a wrapper
        services.AddMemoryCache();
        services.AddScoped<ICache, MemoryCache>();
    }
}
