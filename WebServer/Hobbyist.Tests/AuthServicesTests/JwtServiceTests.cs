using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class JwtServiceTests : DatabaseTestBase
{
    private JwtService _jwtService = null!;
    private IConfiguration _configuration = null!;
    private UserEntity _testUser = null!;
    private UserEntity _testUser2 = null!;

    protected override async Task SeedTestClassDataAsync()
    {
        // Seed common test users that all tests will use
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
        // Setup services needed for each test
        var configurationBuilder = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "this-is-a-very-long-secret-key-for-testing-256-bits",
                ["Jwt:Issuer"] = "hobbyist-test-issuer",
                ["Jwt:Audience"] = "hobbyist-test-audience",
            }
        );

        _configuration = configurationBuilder.Build();
        _jwtService = new JwtService(_configuration, Context);

        return Task.CompletedTask;
    }

    #region CreateAccessToken Integration Tests

    [Test]
    public void CreateAccessToken_WithValidUser_ReturnsValidJwtToken()
    {
        // Arrange
        var tokenValidForMinutes = 30;

        // Act
        var result = _jwtService.CreateAccessToken(_testUser, tokenValidForMinutes);

        // Assert
        Assert.That(result, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Value, Is.Not.Null.And.Not.Empty);
            Assert.That(result.ExpiresAt, Is.GreaterThan(DateTime.UtcNow));
        }

        // Verify the token can be parsed and contains expected claims
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
        // Arrange
        var tokenValidForMinutes = 30;

        // Act
        var token1 = _jwtService.CreateAccessToken(_testUser, tokenValidForMinutes);
        var token2 = _jwtService.CreateAccessToken(_testUser2, tokenValidForMinutes);

        // Assert
        Assert.That(token1.Value, Is.Not.EqualTo(token2.Value));

        // Verify both tokens are valid and contain correct user data
        var tokenHandler = new JwtSecurityTokenHandler();

        var jwt1 = tokenHandler.ReadJwtToken(token1.Value);
        Assert.That(
            jwt1.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value,
            Is.EqualTo(_testUser.Id.ToString())
        );

        var jwt2 = tokenHandler.ReadJwtToken(token2.Value);
        Assert.That(
            jwt2.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value,
            Is.EqualTo(_testUser2.Id.ToString())
        );
    }

    [Test]
    public void CreateAccessToken_GeneratedToken_CanBeValidatedWithSameSecret()
    {
        // Arrange
        var tokenValidForMinutes = 30;
        var token = _jwtService.CreateAccessToken(_testUser, tokenValidForMinutes);

        // Act & Assert - Try to validate the token
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidIssuer = _configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = _configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };

        // This should not throw if the token is valid
        var principal = tokenHandler.ValidateToken(token.Value, validationParameters, out _);

        Assert.That(principal, Is.Not.Null);
        Assert.That(principal.Identity, Is.Not.Null);
        Assert.That(principal.Identity.IsAuthenticated, Is.True);
    }

    [Test]
    public void CreateAccessToken_SetsCorrectExpirationTime()
    {
        // Arrange
        var tokenValidForMinutes = 15;
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _jwtService.CreateAccessToken(_testUser, tokenValidForMinutes);

        // Assert
        var afterCreation = DateTime.UtcNow;
        var expectedMin = beforeCreation.AddMinutes(tokenValidForMinutes);
        var expectedMax = afterCreation.AddMinutes(tokenValidForMinutes);

        Assert.That(result.ExpiresAt, Is.GreaterThanOrEqualTo(expectedMin));
        Assert.That(result.ExpiresAt, Is.LessThanOrEqualTo(expectedMax));
    }

    #endregion

    #region CreateRefreshToken Integration Tests

    [Test]
    public void CreateRefreshToken_GeneratesUnique64CharacterTokens()
    {
        // Arrange
        var tokenValidForDays = 7;

        // Act
        var token1 = _jwtService.CreateRefreshToken(tokenValidForDays);
        var token2 = _jwtService.CreateRefreshToken(tokenValidForDays);
        var token3 = _jwtService.CreateRefreshToken(tokenValidForDays);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(token1.Value, Has.Length.EqualTo(64));
            Assert.That(token2.Value, Has.Length.EqualTo(64));
            Assert.That(token3.Value, Has.Length.EqualTo(64));
        }

        // All tokens should be unique
        var tokens = new[] { token1.Value, token2.Value, token3.Value };
        Assert.That(tokens.Distinct().Count(), Is.EqualTo(3));
    }

    [Test]
    public void CreateRefreshToken_SetsCorrectExpiration()
    {
        // Arrange
        var tokenValidForDays = 7;
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _jwtService.CreateRefreshToken(tokenValidForDays);

        // Assert
        var afterCreation = DateTime.UtcNow;
        var expectedMin = beforeCreation.AddDays(tokenValidForDays);
        var expectedMax = afterCreation.AddDays(tokenValidForDays);

        Assert.That(result.ExpiresAt, Is.GreaterThanOrEqualTo(expectedMin));
        Assert.That(result.ExpiresAt, Is.LessThanOrEqualTo(expectedMax));
    }

    [Test]
    public void CreateRefreshToken_ContainsOnlyValidCharacters()
    {
        // Arrange
        var tokenValidForDays = 7;

        // Act
        var result = _jwtService.CreateRefreshToken(tokenValidForDays);

        // Assert
        Assert.That(result.Value, Does.Match(@"^[A-Za-z0-9]{64}$"));
    }

    #endregion

    #region HashToken Integration Tests

    [Test]
    public void HashToken_ProducesConsistentHashesForSameInput()
    {
        // Arrange
        var token = "test-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz012345";

        // Act
        var hash1 = _jwtService.HashToken(token);
        var hash2 = _jwtService.HashToken(token);
        var hash3 = _jwtService.HashToken(token);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(hash1, Is.EqualTo(hash2));
            Assert.That(hash2, Is.EqualTo(hash3));
        }
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

    [Test]
    public void HashToken_ReturnsBase64String()
    {
        // Arrange
        var token = "test-token";

        // Act
        var result = _jwtService.HashToken(token);

        // Assert
        Assert.That(result, Is.Not.Null.And.Not.Empty);
        Assert.That(result, Does.Match(@"^[A-Za-z0-9+/]+={0,2}$"));
    }

    #endregion

    #region VerifyRefreshTokenAsync Integration Tests

    [Test]
    public async Task VerifyRefreshTokenAsync_WithValidToken_ReturnsNewTokens()
    {
        // Arrange
        var refreshToken = "valid-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz012345";
        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            TokenHash = _jwtService.HashToken(refreshToken),
            TokenExpiresAt = DateTime.UtcNow.AddDays(1),
            UserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
        };

        Context.RefreshTokens.Add(refreshTokenEntity);
        await Context.SaveChangesAsync();

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(refreshToken);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
        }
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Content.AccessToken, Is.Not.Null.And.Not.Empty);
            Assert.That(result.Content.RefreshToken, Is.Not.Null.And.Not.Empty);
            Assert.That(result.Content.AccessTokenExpiresAt, Is.GreaterThan(DateTime.UtcNow));
            Assert.That(result.Content.RefreshTokenExpiresAt, Is.GreaterThan(DateTime.UtcNow));
        }
    }

    [Test]
    public async Task VerifyRefreshTokenAsync_WithValidToken_RotatesRefreshToken()
    {
        // Arrange
        var originalRefreshToken = "original-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz";
        var originalHash = _jwtService.HashToken(originalRefreshToken);

        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            TokenHash = originalHash,
            TokenExpiresAt = DateTime.UtcNow.AddDays(1),
            UserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
        };

        Context.RefreshTokens.Add(refreshTokenEntity);
        await Context.SaveChangesAsync();

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(originalRefreshToken);

        // Assert - Verify the old token is no longer valid
        var oldTokenStillExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == originalHash
        );

        Assert.That(oldTokenStillExists, Is.False, "Old refresh token should be rotated out");

        // Verify new token works
        var newTokenExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == _jwtService.HashToken(result.Content!.RefreshToken)
        );

        Assert.That(newTokenExists, Is.True, "New refresh token should be stored in database");
    }

    [Test]
    public async Task VerifyRefreshTokenAsync_WithInvalidToken_ReturnsNotFound()
    {
        // Arrange
        var invalidToken = "invalid-refresh-token-that-does-not-exist-in-database";

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(invalidToken);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
            Assert.That(result.Message, Is.EqualTo("Invalid refresh token"));
        }
    }

    // [Test]
    // public async Task VerifyRefreshTokenAsync_WithExpiredToken_ReturnsNotFound()
    // {
    //     // Arrange
    //     var expiredToken = "expired-refresh-token-1234567890-abcdefghijklmnopqrstuvwxyz";
    //     var refreshTokenEntity = new RefreshTokenEntity
    //     {
    //         Id = Guid.NewGuid(),
    //         TokenHash = _jwtService.HashToken(expiredToken),
    //         TokenExpiresAt = DateTime.UtcNow.AddDays(-1), // Already expired
    //         UserId = _testUser.Id,
    //         CreatedAt = DateTime.UtcNow,
    //     };

    //     Context.RefreshTokens.Add(refreshTokenEntity);
    //     await Context.SaveChangesAsync();

    //     // Act
    //     var result = await _jwtService.VerifyRefreshTokenAsync(expiredToken);

    //     using (Assert.EnterMultipleScope())
    //     {
    //         // Assert
    //         Assert.That(result.IsSuccess, Is.False);
    //         Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
    //         Assert.That(result.Message, Is.EqualTo("Invalid refresh token"));
    //     }
    // }

    [Test]
    public async Task VerifyRefreshTokenAsync_NewAccessToken_ContainsCorrectUserClaims()
    {
        // Arrange
        var refreshToken = "refresh-token-for-claim-test-1234567890-abcdefghijklmnopqrst";
        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            TokenHash = _jwtService.HashToken(refreshToken),
            TokenExpiresAt = DateTime.UtcNow.AddDays(1),
            UserId = _testUser2.Id, // Use second test user
            CreatedAt = DateTime.UtcNow,
        };

        Context.RefreshTokens.Add(refreshTokenEntity);
        await Context.SaveChangesAsync();

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(refreshToken);

        // Assert - Verify the new access token contains correct user claims
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadJwtToken(result.Content!.AccessToken);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(
                jwtToken.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value,
                Is.EqualTo(_testUser2.Id.ToString())
            );
            Assert.That(
                jwtToken.Claims.First(c => c.Type == ClaimTypes.Name).Value,
                Is.EqualTo(_testUser2.Username)
            );
            Assert.That(
                jwtToken.Claims.First(c => c.Type == ClaimTypes.Email).Value,
                Is.EqualTo(_testUser2.Email)
            );
        }
    }

    [Test]
    public async Task VerifyRefreshTokenAsync_NewTokensHaveCorrectExpiration()
    {
        // Arrange
        var refreshToken = "refresh-token-expiration-test-1234567890-abcdefghijklmnopqrs";
        var refreshTokenEntity = new RefreshTokenEntity
        {
            Id = Guid.NewGuid(),
            TokenHash = _jwtService.HashToken(refreshToken),
            TokenExpiresAt = DateTime.UtcNow.AddDays(1),
            UserId = _testUser.Id,
            CreatedAt = DateTime.UtcNow,
        };

        Context.RefreshTokens.Add(refreshTokenEntity);
        await Context.SaveChangesAsync();

        var beforeVerification = DateTime.UtcNow;

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(refreshToken);

        // Assert
        var afterVerification = DateTime.UtcNow;

        // Check access token expiration
        var accessTokenMinExp = beforeVerification.AddMinutes(
            AuthConfig.AccessTokenValidForMinutes
        );
        var accessTokenMaxExp = afterVerification.AddMinutes(AuthConfig.AccessTokenValidForMinutes);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(
                result.Content!.AccessTokenExpiresAt,
                Is.GreaterThanOrEqualTo(accessTokenMinExp)
            );
            Assert.That(
                result.Content.AccessTokenExpiresAt,
                Is.LessThanOrEqualTo(accessTokenMaxExp)
            );
        }

        // Check refresh token expiration
        var refreshTokenMinExp = beforeVerification.AddDays(AuthConfig.RefreshTokenValidForDays);
        var refreshTokenMaxExp = afterVerification.AddDays(AuthConfig.RefreshTokenValidForDays);
        Assert.That(
            result.Content.RefreshTokenExpiresAt,
            Is.GreaterThanOrEqualTo(refreshTokenMinExp)
        );
        Assert.That(result.Content.RefreshTokenExpiresAt, Is.LessThanOrEqualTo(refreshTokenMaxExp));
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task VerifyRefreshTokenAsync_WithMalformedToken_ReturnsNotFound()
    {
        // Arrange
        var malformedToken = "short-token"; // Too short to be valid

        // Act
        var result = await _jwtService.VerifyRefreshTokenAsync(malformedToken);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
        }
    }

    #endregion
}
