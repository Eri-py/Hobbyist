namespace Hobbyist.Api.Services.Auth.TokenServices;

public static class TokenConfig
{
    /// <summary>
    /// Time in minutes that Access Token is valid for
    /// </summary>
    public const int AccessTokenValidForMinutes = 15;

    /// <summary>
    /// Time in days that Refresh Token is valid for
    /// </summary>
    public const int RefreshTokenValidForDays = 7;
}
