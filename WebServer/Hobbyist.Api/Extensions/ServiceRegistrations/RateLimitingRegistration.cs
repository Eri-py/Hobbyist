using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Hobbyist.Api.Extensions.ServiceRegistrations;

public static class RateLimitingRegistration
{
    public static void AddOtpRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.AddPolicy(
                "otp",
                context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            Window = TimeSpan.FromMinutes(1),
                            PermitLimit = 5,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0,
                        }
                    )
            );
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });
    }
}
