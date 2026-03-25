using Hobbyist.Api.Services.Auth.AuthServices;
using Hobbyist.Api.Services.Auth.LoginServices;
using Hobbyist.Api.Services.Auth.OtpServices;
using Hobbyist.Api.Services.Auth.SignUpServices;
using Hobbyist.Api.Services.Auth.TokenServices;
using Hobbyist.Api.Services.MediaStorageServices;
using Hobbyist.Api.Services.PostServices;
using Hobbyist.Api.Services.Recommendation.Onboarding;

namespace Hobbyist.Api.Extensions.ServiceRegistrations;

public static class DomainServicesRegistration
{
    public static void AddDomainServices(this IServiceCollection services)
    {
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<ILoginService, LoginService>();
        services.AddScoped<ISignUpService, SignUpService>();
        services.AddScoped<ITokenService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOnboardingRecommendationService, OnboardingRecommendationService>();
        services.AddScoped<IMediaStorageService, MediaStorageService>();
        services.AddScoped<IPostService, PostService>();
    }
}
