namespace Hobbyist.Common;

public static class DatabaseConnectionString
{
    public static string Normalize(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            throw new InvalidOperationException("Database connection string cannot be empty.");
        }

        if (raw.StartsWith("postgres://") || raw.StartsWith("postgresql://"))
        {
            var uri = new Uri(raw);
            var userInfo = uri.UserInfo.Split(':');

            return $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};";
        }

        return raw;
    }
}
