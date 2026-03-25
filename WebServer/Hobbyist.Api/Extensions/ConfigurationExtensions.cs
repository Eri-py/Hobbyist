namespace Hobbyist.Api.Extensions;

public static class ConfigurationExtensions
{
    public static string GetCorsPolicy(this IConfiguration configuration)
    {
        return configuration["ClientOrigin:Name"]
            ?? throw new InvalidOperationException("Missing 'ClientOrigin:Name' configuration.");
    }
}
