namespace Hobbyist.Api.Extensions.ServiceRegistrations.InfrastructureServices;

public static class CorsRegistration
{
    public static void AddAppCors(this IServiceCollection services, IConfiguration configuration)
    {
        var name = configuration["ClientOrigin:Name"];
        var address = configuration["ClientOrigin:Address"];

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(address))
        {
            throw new InvalidOperationException(
                "Missing CORS configuration. Set both 'ClientOrigin:Name' and 'ClientOrigin:Address'."
            );
        }

        services.AddCors(options =>
        {
            options.AddPolicy(
                name,
                policy =>
                    policy.WithOrigins(address).AllowAnyHeader().AllowAnyMethod().AllowCredentials()
            );
        });
    }
}
