using Hobbyist.Api.Services.MediaStorageServices.ObjectStoreServices;
using Hobbyist.Api.Services.MediaStorageServices.UrlSignerServices;

namespace Hobbyist.Api.Extensions.ServiceRegistrations.InfrastructureServices;

public static class MediaStorageServiceRegistration
{
    public static void AddMediaStorage(
        this IServiceCollection services,
        IHostEnvironment environment
    )
    {
        // Segregated media storage services (MinIO-backed in every environment for now).
        // TODO: swap to production S3-backed implementations when ready.
        services.AddScoped<IMediaUrlSigner, MinioMediaUrlSigner>();
        services.AddScoped<IMediaObjectStore, MinioMediaObjectStore>();
    }
}
