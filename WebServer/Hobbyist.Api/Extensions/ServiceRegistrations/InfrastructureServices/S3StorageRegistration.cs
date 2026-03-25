using Amazon.Runtime;
using Amazon.S3;

namespace Hobbyist.Api.Extensions.ServiceRegistrations.InfrastructureServices;

public static class S3StorageRegistration
{
    public static void AddS3Storage(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IAmazonS3>(_ =>
        {
            var endpoint =
                configuration["MediaStorage:Endpoint"]
                ?? throw new InvalidOperationException(
                    "Missing 'MediaStorage:Endpoint' configuration."
                );
            var accessKey =
                configuration["MediaStorage:AccessKey"]
                ?? throw new InvalidOperationException(
                    "Missing 'MediaStorage:AccessKey' configuration."
                );
            var secretKey =
                configuration["MediaStorage:SecretKey"]
                ?? throw new InvalidOperationException(
                    "Missing 'MediaStorage:SecretKey' configuration."
                );

            var useSsl =
                bool.TryParse(configuration["MediaStorage:UseSsl"], out var sslValue) && sslValue;

            return new AmazonS3Client(
                new BasicAWSCredentials(accessKey, secretKey),
                new AmazonS3Config
                {
                    ServiceURL = endpoint,
                    ForcePathStyle = true,
                    UseHttp = !useSsl,
                }
            );
        });
    }
}
