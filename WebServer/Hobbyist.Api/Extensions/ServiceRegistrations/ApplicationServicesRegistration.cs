using Hobbyist.Api.Services.Auth.AuthServices;
using Hobbyist.Api.Services.Auth.LoginServices;
using Hobbyist.Api.Services.Auth.OtpServices;
using Hobbyist.Api.Services.Auth.SignUpServices;
using Hobbyist.Api.Services.Auth.TokenServices;
using Hobbyist.Api.Services.Recommendation.Onboarding;
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
        services.AddScoped<IOnboardingRecommendationService, OnboardingRecommendationService>();

        // Infrastructure
        services.AddDatabases(configuration);
        services.AddCacheServices(configuration);
        services.AddEmailServices(environment);

        // Auth & security
        services.AddJwtAuthentication(configuration);
        services.AddAppCors(configuration);
    }
}
