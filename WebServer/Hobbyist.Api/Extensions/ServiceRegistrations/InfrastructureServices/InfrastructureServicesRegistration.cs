namespace Hobbyist.Api.Extensions.ServiceRegistrations.InfrastructureServices;

public static class InfrastructureServicesRegistration
{
    public static void AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment
    )
    {
        services.AddS3Storage(configuration);
        services.AddDatabases(configuration);
        services.AddCacheServices(configuration);
        services.AddEmailServices(environment);
        services.AddJwtAuthentication(configuration);
        services.AddAppCors(configuration);
    }
}
