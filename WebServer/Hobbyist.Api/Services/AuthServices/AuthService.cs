using System.Security.Claims;
using Hobbyist.Api.Data;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.TokenServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.AuthServices;

public class AuthService(ITokenService tokenService, HobbyistDbContext context) : IAuthService
{
    public async Task<GetUserResponse> GetUserDetailsAsync(
        ClaimsPrincipal user,
        HttpContext httpContext,
        HttpRequest request
    )
    {
        // Load user details from claims and verify account still exists
        var userDto = await GetUserDtoAsync(user);
        if (userDto == null)
        {
            // User was deleted - clear cookies and return unauthenticated
            var platform = request.GetPlatform();
            if (platform == "web")
            {
                httpContext.ClearAuthCookies();
            }

            return new GetUserResponse { IsAuthenticated = false, User = null };
        }

        return new GetUserResponse { IsAuthenticated = true, User = userDto };
    }

    public Task<Result<AuthResult>> RefreshTokenAsync(HttpRequest request)
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

        return tokenService.VerifyRefreshTokenAsync(refreshToken);
    }

    private async Task<UserDto?> GetUserDtoAsync(ClaimsPrincipal user)
    {
        // Extract user id from claims
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return null;
        }

        // Verify user still exists in database
        var userExists = await context.Users.AnyAsync(u => u.Id == userGuid);
        if (!userExists)
        {
            return null;
        }

        return new UserDto
        {
            Id = userId,
            Username = user.Identity!.Name!,
            Email = user.FindFirst(ClaimTypes.Email)!.Value,
            Firstname = user.FindFirst(ClaimTypes.GivenName)!.Value,
            Lastname = user.FindFirst(ClaimTypes.Surname)!.Value,
        };
    }
}
