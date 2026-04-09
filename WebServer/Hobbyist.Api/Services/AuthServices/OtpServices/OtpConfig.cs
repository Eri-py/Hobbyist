namespace Hobbyist.Api.Services.AuthServices.OtpServices;

public static class OtpConfig
{
    /// <summary>
    /// Time in minutes that OTP (One-Time Password) is valid for
    /// </summary>
    public const int OtpValidForMinutes = 5;

    /// <summary>
    /// Maximum number of OTP sends allowed per email per window
    /// </summary>
    public const int OtpMaxSendsPerWindow = 5;

    /// <summary>
    /// Maximum number of failed OTP verification attempts allowed per email and purpose.
    /// </summary>
    public const int OtpMaxVerificationAttempts = 5;

    /// <summary>
    /// The rate limit window duration in minutes
    /// </summary>
    public const int OtpRateLimitWindowMinutes = 10;

    /// <summary>
    /// The failed verification attempt window in minutes.
    /// </summary>
    public const int OtpVerificationAttemptWindowMinutes = OtpValidForMinutes;
}
