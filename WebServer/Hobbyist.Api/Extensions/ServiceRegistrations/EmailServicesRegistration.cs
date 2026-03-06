using Hobbyist.Api.Services.EmailServices;

namespace Hobbyist.Api.Extensions.ServiceRegistrations;

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
        else if (environment.IsProduction())
        {
            services.AddScoped<IEmailService, ResendEmailService>();
        }
    }
}
