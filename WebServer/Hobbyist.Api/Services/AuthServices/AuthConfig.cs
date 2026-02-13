namespace Hobbyist.Api.Services.AuthServices;

public record AuthConfig
{
    /// <summary>
    /// Purpose identifier for login OTP operations
    /// </summary>
    public const string LoginPurpose = "login";

    /// <summary>
    /// Purpose identifier for sign-up OTP operations
    /// </summary>
    public const string SignUpPurpose = "signup";

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
    /// Time in minutes that Access Token is valid for
    /// </summary>
    public const int AccessTokenValidForMinutes = 15;

    /// <summary>
    /// Time in days that Refresh Token is valid for
    /// </summary>
    public const int RefreshTokenValidForDays = 7;
}
