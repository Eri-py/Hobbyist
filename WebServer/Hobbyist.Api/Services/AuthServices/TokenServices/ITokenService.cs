using Hobbyist.Api.Data.Entities;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.AuthServices.TokenServices;

/// <summary>
/// Contains token value and expiration information.
/// </summary>
public record TokenDetails
{
    public required string Value { get; set; }
    public required DateTime ExpiresAt { get; set; }
}

public interface ITokenService
{
    /// <summary>
    /// Creates an access token for the specified user.
    /// </summary>
    /// <param name="user">The user entity to create token for. See <see cref="UserEntity"/></param>
    /// <param name="tokenValidFor">Token validity duration in minutes</param>
    /// <returns><see cref="TokenDetails"/> containing the token and expiration</returns>
    public TokenDetails CreateAccessToken(UserEntity user, int tokenValidFor);

    /// <summary>
    /// Creates a cryptographically secure refresh token.
    /// </summary>
    /// <param name="tokenValidForDays">Token validity duration in days</param>
    /// <returns><see cref="TokenDetails"/> containing the token and expiration</returns>
    public TokenDetails CreateRefreshToken(int tokenValidForDays);

    /// <summary>
    /// Verifies and rotates refresh token, returning new access and refresh tokens.
    /// </summary>
    /// <param name="refreshToken">The refresh token to verify</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="AuthResult"/></returns>
    public Task<Result<AuthResult>> VerifyRefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Creates a secure hash of the token for storage.
    /// </summary>
    /// <param name="token">The token to hash</param>
    /// <returns>Hashed representation of the token</returns>
    public string HashToken(string token);
}
