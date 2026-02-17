namespace Hobbyist.Api.Services.OtpServices;

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
}
