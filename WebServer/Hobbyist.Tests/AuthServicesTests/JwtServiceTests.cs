using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class JwtServiceTests : DatabaseTestBase
{
    private JwtService _jwtService = null!;
    private UserEntity _testUser = null!;
    private UserEntity _testUser2 = null!;

    protected override async Task SeedTestClassDataAsync()
    {
        _testUser = new UserEntity
        {
            Id = new Guid("00000000-0000-0000-0000-000000000000"),
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = "hashed_password_123",
            Firstname = "Test",
            Lastname = "User",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
        };

        _testUser2 = new UserEntity
        {
            Id = new Guid("11111111-1111-1111-1111-111111111111"),
            Username = "anotheruser",
            Email = "another@example.com",
            PasswordHash = "hashed_password_456",
            Firstname = "Another",
            Lastname = "User",
            DateOfBirth = new DateOnly(1995, 5, 15),
            CreatedAt = DateTime.UtcNow.AddDays(-15),
        };

        Context.Users.Add(_testUser);
        Context.Users.Add(_testUser2);
        await Context.SaveChangesAsync();
    }

    protected override Task OnSetUpAsync()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Jwt:Secret"] = "this-is-a-very-long-secret-key-for-testing-256-bits",
                    ["Jwt:Issuer"] = "hobbyist-test-issuer",
                    ["Jwt:Audience"] = "hobbyist-test-audience",
                }
            )
            .Build();

        _jwtService = new JwtService(configuration, Context);
        return Task.CompletedTask;
    }

    #region CreateAccessToken Tests

    [Test]
    public void CreateAccessToken_WithValidUser_ReturnsValidJwtTokenWithCorrectExpiration()
    {
        // Act
        var result = _jwtService.CreateAccessToken(
            _testUser,
            AuthConfig.AccessTokenValidForMinutes
        );

        // Assert - Basic token properties
        Assert.That(result, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Value, Is.Not.Null.And.Not.Empty);
            Assert.That(
                result.ExpiresAt,
                Is.EqualTo(DateTime.UtcNow.AddMinutes(AuthConfig.AccessTokenValidForMinutes))
                    .Within(5)
                    .Seconds
            );
        }

        // Verify the token contains all expected claims
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadJwtToken(result.Value);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(
                jwtToken.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value,
                Is.EqualTo(_testUser.Id.ToString())
            );
            Assert.That(
                jwtToken.Claims.First(c => c.Type == ClaimTypes.Name).Value,
                Is.EqualTo(_testUser.Username)
            );
            Assert.That(
                jwtToken.Claims.First(c => c.Type == ClaimTypes.Email).Value,
                Is.EqualTo(_testUser.Email)
            );
            Assert.That(
                jwtToken.Claims.First(c => c.Type == ClaimTypes.GivenName).Value,
                Is.EqualTo(_testUser.Firstname)
            );
            Assert.That(
                jwtToken.Claims.First(c => c.Type == ClaimTypes.Surname).Value,
                Is.EqualTo(_testUser.Lastname)
            );
        }
    }

    [Test]
    public void CreateAccessToken_WithDifferentUsers_CreatesDifferentTokens()
    {
        // Act
        var token1 = _jwtService.CreateAccessToken(
            _testUser,
            AuthConfig.AccessTokenValidForMinutes
        );
        var token2 = _jwtService.CreateAccessToken(
            _testUser2,
            AuthConfig.AccessTokenValidForMinutes
        );

        // Assert
        Assert.That(token1.Value, Is.Not.EqualTo(token2.Value));
    }

    #endregion

    #region CreateRefreshToken Tests

    [Test]
    public void CreateRefreshToken_GeneratesUnique64CharacterTokens()
    {
        // Act
        var token1 = _jwtService.CreateRefreshToken(AuthConfig.RefreshTokenValidForDays);
        var token2 = _jwtService.CreateRefreshToken(AuthConfig.RefreshTokenValidForDays);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(token1.Value, Has.Length.EqualTo(64));
            Assert.That(token2.Value, Has.Length.EqualTo(64));
        }
        Assert.That(token1.Value, Is.Not.EqualTo(token2.Value));
    }

    [Test]
    public void CreateRefreshToken_SetsCorrectExpiration()
    {
        // Act
        var result = _jwtService.CreateRefreshToken(AuthConfig.RefreshTokenValidForDays);

        // Assert
        Assert.That(
            result.ExpiresAt,
            Is.EqualTo(DateTime.UtcNow.AddDays(AuthConfig.RefreshTokenValidForDays))
                .Within(5)
                .Seconds
        );
    }

    [Test]
    public void CreateRefreshToken_ContainsOnlyValidCharacters()
    {
        // Act
        var result = _jwtService.CreateRefreshToken(AuthConfig.RefreshTokenValidForDays);

        // Assert
        Assert.That(result.Value, Does.Match(@"^[A-Za-z0-9]{64}$"));
    }

    #endregion

    #region HashToken Tests

    [Test]
    public void HashToken_ProducesConsistentHashesForSameInput()
    {
        // Arrange
        var token = "test-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz012345";

        // Act
        var hash1 = _jwtService.HashToken(token);
        var hash2 = _jwtService.HashToken(token);

        // Assert
        Assert.That(hash1, Is.EqualTo(hash2));
    }

    [Test]
    public void HashToken_ProducesDifferentHashesForDifferentInputs()
    {
        // Arrange
        var token1 = "test-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz012345";
        var token2 = "different-refresh-token-9876543210-zyxwvutsrqponmlkjihgfedcba";

        // Act
        var hash1 = _jwtService.HashToken(token1);
        var hash2 = _jwtService.HashToken(token2);

        // Assert
        Assert.That(hash1, Is.Not.EqualTo(hash2));
    }

    #endregion

    #region VerifyRefreshTokenAsync Tests

    [Test]
    public async Task VerifyRefreshTokenAsync_WithValidToken_ReturnsNewTokens()
    {
        // Arrange
        var refreshToken = "valid-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz012345";
        Context.RefreshTokens.Add(
            new RefreshTokenEntity
            {
                Id = Guid.NewGuid(),
                TokenHash = _jwtService.HashToken(refreshToken),
                TokenExpiresAt = DateTime.UtcNow.AddDays(AuthConfig.RefreshTokenValidForDays),
                UserId = _testUser.Id,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await Context.SaveChangesAsync();

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(refreshToken);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content, Is.Not.Null);
        }
        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.Content.AccessToken, Is.Not.Null.And.Not.Empty);
            Assert.That(result.Content.RefreshToken, Is.Not.Null.And.Not.Empty);
        }
    }

    [Test]
    public async Task VerifyRefreshTokenAsync_WithValidToken_RotatesRefreshToken()
    {
        // Arrange
        var originalRefreshToken = "original-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz";
        var originalHash = _jwtService.HashToken(originalRefreshToken);

        Context.RefreshTokens.Add(
            new RefreshTokenEntity
            {
                Id = Guid.NewGuid(),
                TokenHash = originalHash,
                TokenExpiresAt = DateTime.UtcNow.AddDays(AuthConfig.RefreshTokenValidForDays),
                UserId = _testUser.Id,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await Context.SaveChangesAsync();

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(originalRefreshToken);

        // Assert
        var oldTokenExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == originalHash
        );
        var newTokenExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == _jwtService.HashToken(result.Content!.RefreshToken)
        );

        using (Assert.EnterMultipleScope())
        {
            Assert.That(oldTokenExists, Is.False);
            Assert.That(newTokenExists, Is.True);
        }
    }

    [Test]
    public async Task VerifyRefreshTokenAsync_WithInvalidToken_ReturnsNotFound()
    {
        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync("invalid-token");

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
        }
    }

    // TODO: Implement expiration check in VerifyRefreshTokenAsync
    // [Test]
    // public async Task VerifyRefreshTokenAsync_WithExpiredToken_ReturnsNotFound()
    // {
    //     // Arrange
    //     var expiredToken = "expired-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz";
    //     Context.RefreshTokens.Add(
    //         new RefreshTokenEntity
    //         {
    //             Id = Guid.NewGuid(),
    //             TokenHash = _jwtService.HashToken(expiredToken),
    //             TokenExpiresAt = DateTime.UtcNow.AddDays(-1),
    //             UserId = _testUser.Id,
    //             CreatedAt = DateTime.UtcNow,
    //         }
    //     );
    //     await Context.SaveChangesAsync();
    //
    //     // Act
    //     var result = await _jwtService.VerifyRefreshTokenAsync(expiredToken);
    //
    //     using (Assert.EnterMultipleScope())
    //     {
    //         // Assert
    //         Assert.That(result.IsSuccess, Is.False);
    //         Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    //     }
    // }

    [Test]
    public async Task VerifyRefreshTokenAsync_NewTokensHaveCorrectExpiration()
    {
        // Arrange
        var refreshToken = "refresh-token-expiration-test-1234567890-abcdefghijklmnopqrs";
        Context.RefreshTokens.Add(
            new RefreshTokenEntity
            {
                Id = Guid.NewGuid(),
                TokenHash = _jwtService.HashToken(refreshToken),
                TokenExpiresAt = DateTime.UtcNow.AddDays(AuthConfig.RefreshTokenValidForDays),
                UserId = _testUser.Id,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await Context.SaveChangesAsync();

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(refreshToken);

        // Assert
        Assert.That(result.Content, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(
                result.Content.AccessTokenExpiresAt,
                Is.EqualTo(DateTime.UtcNow.AddMinutes(AuthConfig.AccessTokenValidForMinutes))
                    .Within(5)
                    .Seconds
            );
            Assert.That(
                result.Content.RefreshTokenExpiresAt,
                Is.EqualTo(DateTime.UtcNow.AddDays(AuthConfig.RefreshTokenValidForDays))
                    .Within(5)
                    .Seconds
            );
        }
    }

    #endregion
}
