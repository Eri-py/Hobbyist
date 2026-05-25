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
        var origin = request.Headers.Origin.FirstOrDefault();
        if (string.IsNullOrEmpty(origin))
            return "mobile";

        var config = request.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var webOrigin = config["ClientOrigin:Address"];

        if (origin.Equals(webOrigin, StringComparison.OrdinalIgnoreCase))
            return "web";

        var logger = request
            .HttpContext.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger(nameof(HttpExtensions));
        logger.LogWarning(
            "Request received with unrecognised Origin '{Origin}'. Expected '{WebOrigin}'.",
            origin.SanitizeForLog(),
            webOrigin
        );

        throw new BadHttpRequestException($"Request origin '{origin}' is not allowed.");
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
