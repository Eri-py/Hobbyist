using System.Security.Claims;
using Hobbyist.Api.Data;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.AuthServices.AuthSessionServices;

public class AuthSessionService(
    ITokenService tokenService,
    HobbyistDbContext context,
    ILogger<AuthSessionService> logger
) : IAuthSessionService
{
    public async Task<GetUserResponse> GetUserDetailsAsync(
        ClaimsPrincipal user,
        HttpContext httpContext,
        HttpRequest request,
        CancellationToken ct
    )
    {
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // No valid claims — unauthenticated request, nothing to warn about
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return new GetUserResponse { IsAuthenticated = false, User = null };
        }

        var userDto = await GetUserDtoAsync(userGuid, user, ct);
        if (userDto == null)
        {
            // Token was valid but the account no longer exists
            var platform = request.GetPlatform();
            logger.LogWarning(
                "get-user-details called for deleted user {UserId} (platform: {Platform})",
                userId,
                platform
            );
            if (platform == "web")
            {
                httpContext.ClearAuthCookies();
            }

            return new GetUserResponse { IsAuthenticated = false, User = null };
        }

        return new GetUserResponse { IsAuthenticated = true, User = userDto };
    }

    public Task<Result<AuthResult>> RefreshTokenAsync(HttpRequest request, CancellationToken ct)
    {
        // Get refresh token from cookie for web or refreshToken header for mobile
        var platform = request.GetPlatform();
        string? refreshToken = null;

        if (platform == "mobile")
        {
            refreshToken = request.Headers["refreshToken"].FirstOrDefault();
        }
        else if (platform == "web")
        {
            refreshToken = request.Cookies["__Secure-refreshToken"];
        }

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Task.FromResult(
                Result<AuthResult>.BadRequest(ErrorMessages.InvalidRefreshToken)
            );
        }

        return tokenService.RotateRefreshTokenAsync(refreshToken, ct);
    }

    private async Task<UserDto?> GetUserDtoAsync(
        Guid userGuid,
        ClaimsPrincipal user,
        CancellationToken ct
    )
    {
        // Verify user still exists in database
        var userExists = await context.Users.AnyAsync(u => u.Id == userGuid, ct);
        if (!userExists)
        {
            return null;
        }

        return new UserDto
        {
            Id = userGuid.ToString(),
            Username = user.Identity!.Name!,
            Email = user.FindFirst(ClaimTypes.Email)!.Value,
            Firstname = user.FindFirst(ClaimTypes.GivenName)!.Value,
            Lastname = user.FindFirst(ClaimTypes.Surname)!.Value,
        };
    }
}
