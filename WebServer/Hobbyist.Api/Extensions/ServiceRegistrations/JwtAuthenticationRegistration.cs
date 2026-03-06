using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Hobbyist.Api.Extensions.ServiceRegistrations;

public static class JwtAuthenticationRegistration
{
    public static void AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configs
    )
    {
        var secret =
            configs["Jwt:Secret"]
            ?? throw new InvalidOperationException("Missing 'Jwt:Secret' configuration.");
        var issuer =
            configs["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Missing 'Jwt:Issuer' configuration.");
        var audience =
            configs["Jwt:Audience"]
            ?? throw new InvalidOperationException("Missing 'Jwt:Audience' configuration.");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
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
    }
}
