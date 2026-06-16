using System.Security.Cryptography;
using System.Text;

namespace Hobbyist.Api.Services.LoggingHashServices;

public class HmacLogHasherService(IConfiguration configuration) : ILogHasherService
{
    private readonly byte[] _keyBytes = Encoding.UTF8.GetBytes(
        configuration["Security:LogHashKey"]
            ?? configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException(
                "Missing log hash key. Configure 'Security:LogHashKey'."
            )
    );

    public string Hash(string? value)
    {
        var normalized = value?.Trim().ToLowerInvariant() ?? string.Empty;
        using var hmac = new HMACSHA256(_keyBytes);
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(hashBytes);
    }
}
