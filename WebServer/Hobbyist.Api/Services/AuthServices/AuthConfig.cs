namespace Hobbyist.Api.Services.AuthServices;

public record AuthConfig
{
    /// <summary>
    /// Time in minutes that OTP (One-Time Password) is valid for
    /// </summary>
    public static int OtpValidForMinutes => 5;

    /// <summary>
    /// Time in minutes that Access Token is valid for
    /// </summary>
    public static int AccessTokenValidForMinutes => 15;

    /// <summary>
    /// Time in days that Refresh Token is valid for
    /// </summary>
    public static int RefreshTokenValidForDays => 7;
}
