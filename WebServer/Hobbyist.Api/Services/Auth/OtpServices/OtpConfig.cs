namespace Hobbyist.Api.Services.Auth.OtpServices;

public static class OtpConfig
{
    /// <summary>
    /// Time in minutes that OTP (One-Time Password) is valid for
    /// </summary>
    public const int OtpValidForMinutes = 5;

    /// <summary>
    /// Max attempts allowed for a single OTP
    /// </summary>
    public const int OtpMaxAttempts = 5;

    /// <summary>
    /// Time in minutes that OTP verification stays valid
    /// </summary>
    public const int OtpVerifiedForMinutes = 15;

    /// <summary>
    /// Maximum number of OTP sends allowed per email per window
    /// </summary>
    public const int OtpMaxSendsPerWindow = 5;

    /// <summary>
    /// The rate limit window duration in minutes
    /// </summary>
    public const int OtpRateLimitWindowMinutes = 10;
}

public record OtpRateLimitEntry(int Count, DateTimeOffset WindowExpiry);
