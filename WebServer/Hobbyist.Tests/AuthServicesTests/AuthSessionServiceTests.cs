using System.Security.Claims;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Services.AuthServices.AuthSessionServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class AuthSessionServiceTests : DatabaseTestBase
{
    private AuthSessionService _authSessionService = null!;
    private Mock<ITokenService> _tokenServiceMock = null!;
    private UserEntity _testUser = null!;

    protected override async Task SeedTestClassDataAsync()
    {
        _testUser = new UserEntity
        {
            Id = new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            Username = "authuser",
            Email = "auth@example.com",
            PasswordHash = "hashed",
            Firstname = "Auth",
            Lastname = "User",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTime.UtcNow.AddDays(-10),
        };

        Context.Users.Add(_testUser);
        await Context.SaveChangesAsync();
    }

    protected override Task OnSetUpAsync()
    {
        _tokenServiceMock = new Mock<ITokenService>();
        _authSessionService = new AuthSessionService(
            _tokenServiceMock.Object,
            Context,
            NullLogger<AuthSessionService>.Instance
        );
        return Task.CompletedTask;
    }

    private static ClaimsPrincipal BuildClaims(
        Guid userId,
        string username,
        string email,
        string firstname,
        string lastname
    )
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.GivenName, firstname),
            new Claim(ClaimTypes.Surname, lastname),
        };
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    private const string WebOrigin = "https://web.example.com";

    private static DefaultHttpContext BuildHttpContext(string platform, string? cookieHeader = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["ClientOrigin:Address"] = WebOrigin }
            )
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddLogging();

        var ctx = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() };

        if (platform == "web")
            ctx.Request.Headers.Origin = WebOrigin;

        if (cookieHeader != null)
            ctx.Request.Headers.Cookie = cookieHeader;

        return ctx;
    }

    #region GetUserDetailsAsync Tests

    [Test]
    public async Task GetUserDetailsAsync_WithValidUser_ReturnsAuthenticatedResponse()
    {
        // Arrange
        var claims = BuildClaims(
            _testUser.Id,
            _testUser.Username,
            _testUser.Email,
            _testUser.Firstname,
            _testUser.Lastname
        );
        var httpContext = BuildHttpContext("web");

        // Act
        var result = await _authSessionService.GetUserDetailsAsync(
            claims,
            httpContext,
            httpContext.Request,
            CancellationToken.None
        );

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsAuthenticated, Is.True);
            Assert.That(result.User, Is.Not.Null);
        }

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.User!.Email, Is.EqualTo(_testUser.Email));
            Assert.That(result.User.Username, Is.EqualTo(_testUser.Username));
        }
    }

    [Test]
    public async Task GetUserDetailsAsync_WithDeletedUser_WebPlatform_ReturnsUnauthenticated()
    {
        // Arrange — user ID that does not exist in the database
        var deletedUserId = Guid.NewGuid();
        var claims = BuildClaims(deletedUserId, "ghost", "ghost@example.com", "Ghost", "User");
        var httpContext = BuildHttpContext("web");

        // Act
        var result = await _authSessionService.GetUserDetailsAsync(
            claims,
            httpContext,
            httpContext.Request,
            CancellationToken.None
        );

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsAuthenticated, Is.False);
            Assert.That(result.User, Is.Null);
        }
    }

    [Test]
    public async Task GetUserDetailsAsync_WithDeletedUser_WebPlatform_ClearsCookies()
    {
        // Arrange — user ID that does not exist in the database
        var deletedUserId = Guid.NewGuid();
        var claims = BuildClaims(deletedUserId, "ghost", "ghost@example.com", "Ghost", "User");
        var httpContext = BuildHttpContext("web");

        // Act
        _ = await _authSessionService.GetUserDetailsAsync(
            claims,
            httpContext,
            httpContext.Request,
            CancellationToken.None
        );

        // Verify cookie-deletion Set-Cookie headers were written
        var setCookieHeaders = httpContext.Response.Headers.SetCookie.ToArray();
        Assert.That(
            setCookieHeaders,
            Has.Some.Contains("accessToken="),
            "Should issue a cookie-deletion header for accessToken"
        );
    }

    [Test]
    public async Task GetUserDetailsAsync_WithDeletedUser_MobilePlatform_DoesNotClearCookies()
    {
        // Arrange
        var deletedUserId = Guid.NewGuid();
        var claims = BuildClaims(deletedUserId, "ghost", "ghost@example.com", "Ghost", "User");
        var httpContext = BuildHttpContext("mobile");

        // Act
        var result = await _authSessionService.GetUserDetailsAsync(
            claims,
            httpContext,
            httpContext.Request,
            CancellationToken.None
        );

        // Assert
        Assert.That(result.IsAuthenticated, Is.False);
        var setCookieHeaders = httpContext.Response.Headers.SetCookie.ToArray();
        Assert.That(setCookieHeaders, Is.Empty, "Mobile platform should not set any cookies");
    }

    [Test]
    public async Task GetUserDetailsAsync_WithEmptyClaims_ReturnsFalse()
    {
        // Arrange — principal with no NameIdentifier claim (unauthenticated)
        var emptyPrincipal = new ClaimsPrincipal(new ClaimsIdentity());
        var httpContext = BuildHttpContext("web");

        // Act
        var result = await _authSessionService.GetUserDetailsAsync(
            emptyPrincipal,
            httpContext,
            httpContext.Request,
            CancellationToken.None
        );

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsAuthenticated, Is.False);
            Assert.That(result.User, Is.Null);
        }
    }

    #endregion

    #region RefreshTokenAsync Tests

    [Test]
    public async Task RefreshTokenAsync_WebPlatform_ReadsCookieAndCallsTokenService()
    {
        // Arrange
        const string refreshToken = "valid-refresh-token-value";
        var httpContext = BuildHttpContext("web", $"__Secure-refreshToken={refreshToken}");
        var expectedResult = Result<AuthResult>.Success(
            new AuthResult
            {
                AccessToken = "new-access",
                RefreshToken = "new-refresh",
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(15),
                RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30),
            }
        );
        _tokenServiceMock
            .Setup(t => t.RotateRefreshTokenAsync(refreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _authSessionService.RefreshTokenAsync(
            httpContext.Request,
            body: null,
            CancellationToken.None
        );

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _tokenServiceMock.Verify(
            t => t.RotateRefreshTokenAsync(refreshToken, It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Test]
    public async Task RefreshTokenAsync_MobilePlatform_ReadsBodyAndCallsTokenService()
    {
        // Arrange
        const string refreshToken = "mobile-refresh-token";
        var httpContext = BuildHttpContext("mobile");
        var body = new RefreshTokenRequest { RefreshToken = refreshToken };
        var expectedResult = Result<AuthResult>.Success(
            new AuthResult
            {
                AccessToken = "new-access",
                RefreshToken = "new-refresh",
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(15),
                RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30),
            }
        );
        _tokenServiceMock
            .Setup(t => t.RotateRefreshTokenAsync(refreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _authSessionService.RefreshTokenAsync(
            httpContext.Request,
            body,
            CancellationToken.None
        );

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _tokenServiceMock.Verify(
            t => t.RotateRefreshTokenAsync(refreshToken, It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Test]
    public async Task RefreshTokenAsync_MissingToken_ReturnsBadRequest()
    {
        // Arrange — no cookie, no body
        var httpContext = BuildHttpContext("web");

        // Act
        var result = await _authSessionService.RefreshTokenAsync(
            httpContext.Request,
            body: null,
            CancellationToken.None
        );

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        }
        _tokenServiceMock.Verify(
            t => t.RotateRefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    #endregion
}
