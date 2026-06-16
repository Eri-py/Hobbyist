using Hobbyist.Common;

namespace Hobbyist.Api.Services.CacheRateLimiterServices;

public record RateLimitEntry(int Count, DateTimeOffset WindowExpiry);

public interface ICacheRateLimiterService
{
    /// <summary>
    /// Checks whether requests are still allowed for a given scope/identifier pair.
    /// </summary>
    /// <param name="scope">A logical limiter scope (example: "otp_send_signup")</param>
    /// <param name="identifier">A stable identifier (example: hashed email, user id)</param>
    /// <param name="maxRequests">Maximum requests allowed in the given window</param>
    /// <param name="tooManyRequestsMessage">Message used when limit is exceeded</param>
    /// <returns><see cref="Result"/></returns>
    public Result CheckLimit(
        string scope,
        string identifier,
        int maxRequests,
        string tooManyRequestsMessage
    );

    /// <summary>
    /// Increments usage for a given scope/identifier pair.
    /// </summary>
    /// <param name="scope">A logical limiter scope (example: "otp_send_signup")</param>
    /// <param name="identifier">A stable identifier (example: hashed email, user id)</param>
    /// <param name="window">Rate limit window duration</param>
    public void Increment(string scope, string identifier, TimeSpan window);

    /// <summary>
    /// Clears any tracked usage for a given scope/identifier pair.
    /// </summary>
    /// <param name="scope">A logical limiter scope</param>
    /// <param name="identifier">A stable identifier</param>
    public void Reset(string scope, string identifier);
}
