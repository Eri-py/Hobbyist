using Hobbyist.Api.Services.LoggingHashServices;

namespace Hobbyist.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseLogHasher(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        LoggerExtensions.ConfigureHasher(app.Services.GetRequiredService<ILogHasherService>());
        return app;
    }
}
