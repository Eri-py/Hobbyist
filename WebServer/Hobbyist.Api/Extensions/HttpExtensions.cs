using System.Security.Claims;
using Hobbyist.Api.Dtos.Auth;

namespace Hobbyist.Api.Extensions;

public static class HttpExtensions
{
    public static string GetUserId(this ClaimsPrincipal user)
    {
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Missing user id claim.");
        }

        return userId;
    }

    public static string GetPlatform(this HttpRequest request)
    {
        var platform = request.Headers["Platform"].FirstOrDefault()?.Trim().ToLowerInvariant();

        if (string.IsNullOrEmpty(platform))
        {
            throw new BadHttpRequestException("Platform header is required");
        }

        if (platform is not ("mobile" or "web"))
        {
            throw new BadHttpRequestException("Platform header must be either 'mobile' or 'web'");
        }

        return platform;
    }

    public static void ClearAuthCookies(this HttpContext httpContext)
    {
        httpContext.Response.Cookies.Delete("accessToken", CreateAuthCookieOptions("/api"));

        httpContext.Response.Cookies.Delete(
            "__Secure-refreshToken",
            CreateAuthCookieOptions("/api/auth-session/refresh-token")
        );
    }

    public static void SetAuthCookies(this HttpContext httpContext, AuthResult tokens)
    {
        var accessTokenOptions = CreateAuthCookieOptions("/api", tokens.AccessTokenExpiresAt);
        var refreshTokenOptions = CreateAuthCookieOptions(
            "/api/auth-session/refresh-token",
            tokens.RefreshTokenExpiresAt
        );

        httpContext.Response.Cookies.Append("accessToken", tokens.AccessToken, accessTokenOptions);
        httpContext.Response.Cookies.Append(
            "__Secure-refreshToken",
            tokens.RefreshToken,
            refreshTokenOptions
        );
    }

    private static CookieOptions CreateAuthCookieOptions(
        string path,
        DateTimeOffset? expires = null
    ) =>
        new()
        {
            Path = path,
            Secure = true,
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
            Expires = expires,
        };
}
