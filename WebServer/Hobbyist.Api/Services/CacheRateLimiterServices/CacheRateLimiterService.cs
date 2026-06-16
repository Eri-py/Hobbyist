using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.CacheRateLimiterServices;

public class CacheRateLimiterService(ICacheService cache, ILogger<CacheRateLimiterService> logger)
    : ICacheRateLimiterService
{
    public Result CheckLimit(
        string scope,
        string identifier,
        int maxRequests,
        string tooManyRequestsMessage
    )
    {
        ValidateInputs(scope, identifier, maxRequests);

        var rateLimitKey = BuildRateLimitKey(scope, identifier);
        cache.TryGetValue<RateLimitEntry>(rateLimitKey, out var entry);

        if (entry is not null && entry.Count >= maxRequests)
        {
            logger.LogWarning(
                "Rate limit exceeded for scope '{Scope}' and identifier hash '{IdentifierHash}'",
                scope,
                logger.Hash(identifier)
            );
            return Result.TooManyRequests(tooManyRequestsMessage);
        }

        return Result.NoContent();
    }

    public void Increment(string scope, string identifier, TimeSpan window)
    {
        ValidateInputs(scope, identifier);
        ValidateWindow(window);

        var rateLimitKey = BuildRateLimitKey(scope, identifier);
        cache.TryGetValue<RateLimitEntry>(rateLimitKey, out var entry);

        var now = DateTimeOffset.UtcNow;
        // Keep a fixed window anchored at first increment until it expires.
        var windowExpiry =
            entry?.WindowExpiry is { } existingExpiry && existingExpiry > now
                ? existingExpiry
                : now.Add(window);

        var remainingWindow = windowExpiry - now;
        // Guard against non-positive TTL from clock drift or near-expiry races.
        if (remainingWindow <= TimeSpan.Zero)
        {
            remainingWindow = window;
        }

        cache.Set(
            rateLimitKey,
            new RateLimitEntry(Count: (entry?.Count ?? 0) + 1, WindowExpiry: windowExpiry),
            remainingWindow
        );
    }

    public void Reset(string scope, string identifier)
    {
        ValidateInputs(scope, identifier);
        var rateLimitKey = BuildRateLimitKey(scope, identifier);
        cache.Remove(rateLimitKey);
    }

    private static string BuildRateLimitKey(string scope, string identifier) =>
        // Key namespace keeps limiter entries distinct from other cache usages.
        $"ratelimit_{scope}_{identifier}";

    private static void ValidateInputs(string scope, string identifier, int? maxRequests = null)
    {
        if (string.IsNullOrWhiteSpace(scope))
            throw new ArgumentException("Rate limiter scope cannot be empty.", nameof(scope));

        if (string.IsNullOrWhiteSpace(identifier))
            throw new ArgumentException(
                "Rate limiter identifier cannot be empty.",
                nameof(identifier)
            );

        if (maxRequests is not null && maxRequests <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(maxRequests),
                "Maximum requests must be greater than 0."
            );
    }

    private static void ValidateWindow(TimeSpan window)
    {
        if (window <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(
                nameof(window),
                "Rate limit window must be greater than 0."
            );
    }
}
