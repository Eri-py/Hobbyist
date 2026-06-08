using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Hobbyist.Api.Services.AuthServices.TokenServices;

public class JwtTokenService(
    IConfiguration configuration,
    HobbyistDbContext context,
    ILogger<JwtTokenService> logger
) : ITokenService
{
    public AccessTokenDetails CreateAccessToken(UserEntity user, int tokenValidForMinutes)
    {
        // Create claims for the JWT token
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.GivenName, user.Firstname!),
            new(ClaimTypes.Surname, user.Lastname!),
        };

        // Generate signing credentials and set expiration
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(tokenValidForMinutes);

        // Create and write JWT token
        var tokenDescriptor = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: creds
        );

        return new AccessTokenDetails
        {
            Value = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor),
            ExpiresAt = expiresAt,
        };
    }

    private static (string Value, DateTimeOffset ExpiresAt) GenerateRefreshToken(
        int tokenValidForDays
    )
    {
        // Generate cryptographically secure random refresh token
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var token = new StringBuilder(64);
        for (int i = 0; i < 64; i++)
        {
            token.Append(chars[CryptoRandom.NextInt() % chars.Length]);
        }

        return (token.ToString(), DateTimeOffset.UtcNow.AddDays(tokenValidForDays));
    }

    public string HashToken(string token) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public RefreshTokenDetails CreateRefreshToken(Guid userId)
    {
        var refreshTokenDetails = GenerateRefreshToken(TokenConfig.RefreshTokenValidForDays);
        var refreshTokenEntry = new RefreshTokenEntity
        {
            TokenHash = HashToken(refreshTokenDetails.Value),
            TokenExpiresAt = refreshTokenDetails.ExpiresAt,
            UserId = userId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        return new RefreshTokenDetails
        {
            Value = refreshTokenDetails.Value,
            ExpiresAt = refreshTokenDetails.ExpiresAt,
            Entry = refreshTokenEntry,
        };
    }

    public async Task<Result<AuthResult>> RotateRefreshTokenAsync(
        string refreshToken,
        CancellationToken ct
    )
    {
        using var transaction = await context.Database.BeginTransactionAsync(ct);
        try
        {
            var tokenEntry = await context
                .RefreshTokens.Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == HashToken(refreshToken), ct);

            if (
                tokenEntry is null
                || tokenEntry.User is null
                || tokenEntry.TokenExpiresAt < DateTimeOffset.UtcNow
            )
            {
                logger.LogWarning(
                    "Refresh token validation failed: {Reason}",
                    tokenEntry is null || tokenEntry.User is null ? "not found" : "expired"
                );
                return Result<AuthResult>.Unauthorized(ErrorMessages.InvalidRefreshToken);
            }

            var nextRefreshToken = CreateRefreshToken(tokenEntry.UserId);
            var accessToken = CreateAccessToken(
                tokenEntry.User,
                TokenConfig.AccessTokenValidForMinutes
            );

            tokenEntry.TokenHash = nextRefreshToken.Entry.TokenHash;
            tokenEntry.TokenExpiresAt = nextRefreshToken.ExpiresAt;

            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return Result<AuthResult>.Success(
                new AuthResult
                {
                    AccessToken = accessToken.Value,
                    RefreshToken = nextRefreshToken.Value,
                    AccessTokenExpiresAt = accessToken.ExpiresAt,
                    RefreshTokenExpiresAt = nextRefreshToken.ExpiresAt,
                }
            );
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            logger.LogError(ex, "Transaction failed during refresh token rotation");
            return Result<AuthResult>.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }
}
