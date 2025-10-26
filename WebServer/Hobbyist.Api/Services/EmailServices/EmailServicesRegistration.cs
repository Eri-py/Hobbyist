using System;

namespace Hobbyist.Api.Services.EmailServices;

public static class EmailServicesRegistration
{
    public static void AddEmailServices(
        this IServiceCollection services,
        IHostEnvironment environment
    )
    {
        if (environment.IsDevelopment())
        {
            services.AddScoped<IEmailService, MailtrapEmailService>();
        }
    }
}
