using Hobbyist.Api.Services.MediaStorageServices;

namespace Hobbyist.Api.Extensions.ServiceRegistrations.InfrastructureServices;

public static class MediaStorageServiceRegistration
{
    public static void AddMediaStorage(
        this IServiceCollection services,
        IHostEnvironment environment
    )
    {
        if (environment.IsDevelopment())
        {
            services.AddScoped<IMediaStorageService, MinIOMediaStorageService>();
        }
        else if (environment.IsProduction())
        {
            // TODO: Replace with production S3 storage service
            services.AddScoped<IMediaStorageService, MinIOMediaStorageService>();
        }
    }
}
