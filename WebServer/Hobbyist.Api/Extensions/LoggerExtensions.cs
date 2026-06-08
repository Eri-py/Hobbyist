using Hobbyist.Api.Services.LoggingHashServices;

namespace Hobbyist.Api.Extensions;

public static class LoggerExtensions
{
    private static ILogHasherService? _configuredHasher;

    public static void ConfigureHasher(ILogHasherService hasher)
    {
        ArgumentNullException.ThrowIfNull(hasher);
        _configuredHasher = hasher;
    }

    public static string Hash(this ILogger _, string? value)
    {
        if (_configuredHasher is null)
            throw new InvalidOperationException(
                "Logger hasher is not configured. Call LoggerExtensions.ConfigureHasher(...) at startup."
            );

        return _configuredHasher.Hash(value);
    }

    public static string SanitizeForLog(this string? value) =>
        value is null
            ? "(null)"
            : value.Replace("\r", "\\r").Replace("\n", "\\n").Replace("\0", "\\0");
}
