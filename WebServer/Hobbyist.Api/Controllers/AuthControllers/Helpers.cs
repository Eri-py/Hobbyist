using System;
using Hobbyist.Api.Services.AuthServices;

namespace Hobbyist.Api.Controllers.AuthControllers;

public class Helpers
{
    public static void SetAuthCookies(HttpContext httpContext, AuthResult tokens)
    {
        var accessTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api",
            Expires = tokens.AccessTokenExpiresAt,
        };

        var refreshTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth/refresh-token",
            Expires = tokens.RefreshTokenExpiresAt,
        };

        httpContext.Response.Cookies.Append("accessToken", tokens.AccessToken, accessTokenOptions);
        httpContext.Response.Cookies.Append(
            "__Secure-refreshToken",
            tokens.RefreshToken,
            refreshTokenOptions
        );
    }
}
