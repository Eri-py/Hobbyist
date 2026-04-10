namespace Hobbyist.Common;

public static class NormalizeConnectionString
{
    public static string NormalizePostgres(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            throw new InvalidOperationException("Database connection string cannot be empty.");
        }

        if (
            !raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
        )
        {
            return raw;
        }

        if (
            !Uri.TryCreate(raw, UriKind.Absolute, out var uri)
            || string.IsNullOrWhiteSpace(uri.Host)
        )
        {
            throw new InvalidOperationException("Invalid PostgreSQL connection URI.");
        }

        var database = Uri.UnescapeDataString(uri.AbsolutePath.Trim('/'));
        if (string.IsNullOrWhiteSpace(database))
        {
            throw new InvalidOperationException("PostgreSQL URI must include a database name.");
        }

        var parts = new List<string>
        {
            $"Host={uri.Host}",
            $"Port={(uri.IsDefaultPort ? 5432 : uri.Port)}",
            $"Database={database}",
        };

        var (username, password, hasPassword) = ParseUserInfo(uri.UserInfo);
        if (!string.IsNullOrWhiteSpace(username))
        {
            parts.Add($"Username={username}");
        }

        if (hasPassword)
        {
            parts.Add($"Password={password ?? string.Empty}");
        }

        return string.Join(';', parts) + ";";
    }

    public static string NormalizeRedis(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            throw new InvalidOperationException("Redis connection string cannot be empty.");
        }

        if (
            !raw.StartsWith("redis://", StringComparison.OrdinalIgnoreCase)
            && !raw.StartsWith("rediss://", StringComparison.OrdinalIgnoreCase)
        )
        {
            return raw;
        }

        if (
            !Uri.TryCreate(raw, UriKind.Absolute, out var uri)
            || string.IsNullOrWhiteSpace(uri.Host)
        )
        {
            throw new InvalidOperationException("Invalid Redis connection URI.");
        }

        var parts = new List<string> { $"{uri.Host}:{(uri.IsDefaultPort ? 6379 : uri.Port)}" };

        var (_, password, hasPassword) = ParseUserInfo(
            uri.UserInfo,
            treatSingleSegmentAsPassword: true
        );
        if (hasPassword)
        {
            parts.Add($"password={password ?? string.Empty}");
        }

        var isSsl = uri.Scheme.Equals("rediss", StringComparison.OrdinalIgnoreCase);
        parts.Add($"ssl={isSsl.ToString().ToLowerInvariant()}");

        return string.Join(',', parts);
    }

    private static (string? Username, string? Password, bool HasPassword) ParseUserInfo(
        string userInfo,
        bool treatSingleSegmentAsPassword = false
    )
    {
        if (string.IsNullOrEmpty(userInfo))
        {
            return (null, null, false);
        }

        var separatorIndex = userInfo.IndexOf(':');
        if (separatorIndex < 0)
        {
            var singleValue = Uri.UnescapeDataString(userInfo);
            return treatSingleSegmentAsPassword
                ? (null, singleValue, true)
                : (singleValue, null, false);
        }

        var username = Uri.UnescapeDataString(userInfo[..separatorIndex]);
        var password = Uri.UnescapeDataString(userInfo[(separatorIndex + 1)..]);
        return (username, password, true);
    }
}
