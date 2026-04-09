namespace Hobbyist.Api.Services.AuthServices.OtpServices;

public static class OtpConfig
{
    /// <summary>
    /// Time in minutes that OTP (One-Time Password) is valid for
    /// </summary>
    public const int OtpLifetimeMinutes = 5;

    /// <summary>
    /// Maximum number of OTP send requests allowed per email per window.
    /// </summary>
    public const int OtpMaxSendRequestsPerWindow = 5;

    /// <summary>
    /// OTP send rate limit window duration in minutes.
    /// </summary>
    public const int OtpSendRateLimitWindowMinutes = 10;

    /// <summary>
    /// Maximum number of failed OTP verification attempts allowed per email and purpose.
    /// </summary>
    public const int OtpMaxFailedVerificationAttempts = 5;

    /// <summary>
    /// OTP verification failure rate limit window duration in minutes.
    /// </summary>
    public const int OtpVerifyRateLimitWindowMinutes = 10;
}
