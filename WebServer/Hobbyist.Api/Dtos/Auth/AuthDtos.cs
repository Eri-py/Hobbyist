using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.Auth;

/// <summary>
/// Response containing current user authentication status and user data if authenticated.
/// </summary>
public record class GetUserResponse
{
    [Required]
    public required bool IsAuthenticated { get; set; }

    public UserDto? User { get; set; }
}

/// <summary>
/// Request containing refresh token for mobile token refresh.
/// </summary>
public record class RefreshTokenRequest
{
    [Required]
    public required string RefreshToken { get; set; }
}

public record class AuthResult
{
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
    public required DateTimeOffset AccessTokenExpiresAt { get; set; }
    public required DateTimeOffset RefreshTokenExpiresAt { get; set; }
}
