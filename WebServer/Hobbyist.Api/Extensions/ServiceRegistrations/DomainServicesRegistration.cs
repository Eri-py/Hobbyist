using Hobbyist.Api.Services.AuthServices.AuthSessionServices;
using Hobbyist.Api.Services.AuthServices.LoginServices;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.SignUpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Api.Services.CacheRateLimiterServices;
using Hobbyist.Api.Services.LoggingHashServices;
using Hobbyist.Api.Services.PostServices.PostUploadServices;
using Hobbyist.Api.Services.ReccommendationServices.OnboardingServices;

namespace Hobbyist.Api.Extensions.ServiceRegistrations;

public static class DomainServicesRegistration
{
    public static void AddDomainServices(this IServiceCollection services)
    {
        services.AddScoped<ICacheRateLimiterService, CacheRateLimiterService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<ILoginService, LoginService>();
        services.AddScoped<ISignUpService, SignUpService>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddSingleton<ILogHasherService, HmacLogHasherService>();
        services.AddScoped<IAuthSessionService, AuthSessionService>();
        services.AddScoped<IOnboardingService, OnboardingService>();
        services.AddScoped<IPostUploadService, PostUploadService>();
    }
}
