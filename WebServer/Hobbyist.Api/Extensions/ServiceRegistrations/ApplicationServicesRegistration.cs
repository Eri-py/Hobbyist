using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.LoginServices;
using Hobbyist.Api.Services.OtpServices;
using Hobbyist.Api.Services.SignUpServices;
using Hobbyist.Api.Services.TokenServices;
using Microsoft.FeatureManagement;

namespace Hobbyist.Api.Extensions.ServiceRegistrations;

public static class ApplicationServicesRegistration
{
    public static void AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment
    )
    {
        // Core
        services.AddControllers();
        services.AddOpenApi();
        services.AddFeatureManagement();

        // Domain services
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<ILoginService, LoginService>();
        services.AddScoped<ISignUpService, SignUpService>();
        services.AddScoped<ITokenService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();

        // Infrastructure
        services.AddDatabases(configuration);
        services.AddCacheServices(configuration);
        services.AddEmailServices(environment);

        // Auth & security
        services.AddJwtAuthentication(configuration);
        services.AddAppCors(configuration);
        services.AddOtpRateLimiting();
    }
}
