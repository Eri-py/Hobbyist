using System.Text;
using Hobbyist.Api.Services.TokenServices;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Hobbyist.Api.Services.AuthServices;

public static class AuthServiceRegistration
{
    public static void AddAuthServices(this IServiceCollection services, IConfiguration configs)
    {
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = configs["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = configs["Jwt:Audience"],
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configs["Jwt:Secret"]!)
                    ),
                };
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        context.Token = context.Request.Cookies["accessToken"];
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddScoped<ITokenService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();
    }
}
