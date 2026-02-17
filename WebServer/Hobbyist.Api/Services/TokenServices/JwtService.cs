using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Hobbyist.Api.Services.TokenServices;

public class JwtService(IConfiguration configuration, HobbyistDbContext context) : ITokenService
{
    public TokenDetails CreateAccessToken(UserEntity user, int tokenValidForMinutes)
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
        var expiresAt = DateTime.UtcNow.AddMinutes(tokenValidForMinutes);

        // Create and write JWT token
        var tokenDescriptor = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        return new TokenDetails
        {
            Value = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor),
            ExpiresAt = expiresAt,
        };
    }

    public TokenDetails CreateRefreshToken(int tokenValidForDays)
    {
        // Generate cryptographically secure random refresh token
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var token = new StringBuilder(64);
        for (int i = 0; i < 64; i++)
        {
            token.Append(chars[CryptoRandom.NextInt() % chars.Length]);
        }

        return new TokenDetails
        {
            Value = token.ToString(),
            ExpiresAt = DateTime.UtcNow.AddDays(tokenValidForDays),
        };
    }

    public string HashToken(string token) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public async Task<Result<AuthResult>> VerifyRefreshTokenAsync(string refreshToken)
    {
        using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // Find token by hash and include user data
            var token = await context
                .RefreshTokens.Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == HashToken(refreshToken));

            // Check if token is non-existent or expired
            if (token is null || token.TokenExpiresAt < DateTime.UtcNow)
            {
                return Result<AuthResult>.Unauthorized(ErrorMessages.InvalidRefreshToken);
            }

            // Generate new tokens
            var newRefreshToken = CreateRefreshToken(TokenConfig.RefreshTokenValidForDays);
            var accessToken = CreateAccessToken(
                token.User!,
                TokenConfig.AccessTokenValidForMinutes
            );

            // Update refresh token with new values (token rotation)
            token.TokenHash = HashToken(newRefreshToken.Value);
            token.TokenExpiresAt = newRefreshToken.ExpiresAt;

            await context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Result<AuthResult>.Success(
                new()
                {
                    AccessToken = accessToken.Value,
                    RefreshToken = newRefreshToken.Value,
                    AccessTokenExpiresAt = accessToken.ExpiresAt,
                    RefreshTokenExpiresAt = newRefreshToken.ExpiresAt,
                }
            );
        }
        catch
        {
            await transaction.RollbackAsync();
            return Result<AuthResult>.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }
}
