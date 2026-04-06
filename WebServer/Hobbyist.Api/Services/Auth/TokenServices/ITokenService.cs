using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.Auth.TokenServices;

/// <summary>
/// Contains token value and expiration information.
/// </summary>
public record AccessTokenDetails
{
    public required string Value { get; set; }
    public required DateTimeOffset ExpiresAt { get; set; }
}

public record RefreshTokenDetails
{
    public required string Value { get; set; }
    public required DateTimeOffset ExpiresAt { get; set; }
    public required RefreshTokenEntity Entry { get; set; }
}

public interface ITokenService
{
    /// <summary>
    /// Creates an access token for the specified user.
    /// </summary>
    /// <param name="user">The user entity to create token for. See <see cref="UserEntity"/></param>
    /// <param name="tokenValidFor">Token validity duration in minutes</param>
    /// <returns><see cref="AccessTokenDetails"/> containing the token and expiration</returns>
    public AccessTokenDetails CreateAccessToken(UserEntity user, int tokenValidFor);

    /// <summary>
    /// Creates a secure hash of the token for storage.
    /// </summary>
    /// <param name="token">The token to hash</param>
    /// <returns>Hashed representation of the token</returns>
    public string HashToken(string token);

    /// <summary>
    /// Creates refresh token details with value and database entry.
    /// </summary>
    /// <param name="userId">The user ID the refresh token belongs to</param>
    /// <returns><see cref="RefreshTokenDetails"/></returns>
    public RefreshTokenDetails CreateRefreshToken(Guid userId);

    /// <summary>
    /// Verifies and rotates refresh token, returning new access and refresh tokens.
    /// </summary>
    /// <param name="refreshToken">The refresh token to verify</param>
    /// <param name="ct">Request cancellation token</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="AuthResult"/></returns>
    public Task<Result<AuthResult>> RotateRefreshTokenAsync(
        string refreshToken,
        CancellationToken ct
    );
}
