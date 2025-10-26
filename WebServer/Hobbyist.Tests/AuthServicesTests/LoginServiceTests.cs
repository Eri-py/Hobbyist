using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.AuthServices.LoginServices;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class LoginServiceTests : DatabaseTestBase
{
    private LoginService _loginService = null!;
    private Mock<IOtpService> _otpServiceMock = null!;
    private Mock<ITokenService> _tokenServiceMock = null!;
    private UserEntity _testUser = null!;
    private readonly string _correctPassword = "CorrectPassword123!";
    private string _hashedCorrectPassword = null!;

    protected override async Task SeedTestClassDataAsync()
    {
        // Create a real password hash for testing
        var hasher = new PasswordHasher<UserEntity>();
        _hashedCorrectPassword = hasher.HashPassword(null!, _correctPassword);

        // Seed a test user
        _testUser = new UserEntity
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            Email = "test@example.com",
            PasswordHash = _hashedCorrectPassword,
            Firstname = "Test",
            Lastname = "User",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
        };

        Context.Users.Add(_testUser);
        await Context.SaveChangesAsync();
    }

    protected override Task OnSetUpAsync()
    {
        // Setup mock services
        _otpServiceMock = new Mock<IOtpService>();
        _tokenServiceMock = new Mock<ITokenService>();

        // Create service instance with real DbContext and mock dependencies
        _loginService = new LoginService(Context, _otpServiceMock.Object, _tokenServiceMock.Object);

        return Task.CompletedTask;
    }

    #region StartLoginAsync Tests

    [Test]
    public async Task StartLoginAsync_WithValidEmailAndPassword_ReturnsOtpResponse()
    {
        // Arrange
        var request = new StartLoginRequest
        {
            Identifier = "test@example.com",
            Password = _correctPassword, // Use the correct password
        };

        var expectedOtpResponse = new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(10) };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(_testUser.Email!, "login"))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
        }

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Content.Email, Is.EqualTo(_testUser.Email));
            Assert.That(
                result.Content.OtpExpiresAt,
                Is.EqualTo(expectedOtpResponse.OtpExpiresAt.ToString("o"))
            );
        }

        _otpServiceMock.Verify(x => x.SendOtpAsync(_testUser.Email!, "login"), Times.Once);
    }

    [Test]
    public async Task StartLoginAsync_WithValidUsernameAndPassword_ReturnsOtpResponse()
    {
        // Arrange
        var request = new StartLoginRequest
        {
            Identifier = "testuser",
            Password = _correctPassword,
        };

        var expectedOtpResponse = new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(10) };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(_testUser.Email!, "login"))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
        }
        Assert.That(result.Content.Email, Is.EqualTo(_testUser.Email));

        _otpServiceMock.Verify(x => x.SendOtpAsync(_testUser.Email!, "login"), Times.Once);
    }

    [Test]
    public async Task StartLoginAsync_WithNonExistentUser_ReturnsNotFound()
    {
        // Arrange
        var request = new StartLoginRequest
        {
            Identifier = "nonexistent@example.com",
            Password = "any_password",
        };

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
            Assert.That(
                result.Message,
                Is.EqualTo("Your login credentials don't match an account in our system.")
            );
        }

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never
        );
    }

    [Test]
    public async Task StartLoginAsync_WithIncorrectPassword_ReturnsNotFound()
    {
        // Arrange
        var request = new StartLoginRequest
        {
            Identifier = "test@example.com",
            Password = "WrongPassword123!", // This will cause password verification to fail
        };

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
            Assert.That(
                result.Message,
                Is.EqualTo("Your login credentials don't match an account in our system.")
            );
        }

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never
        );
    }

    [Test]
    public async Task StartLoginAsync_WhenOtpServiceFails_ReturnsError()
    {
        // Arrange
        var request = new StartLoginRequest
        {
            Identifier = "test@example.com",
            Password = _correctPassword,
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(_testUser.Email!, "login"))
            .ReturnsAsync(Result<OtpResponse>.BadRequest("Failed to send OTP"));

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("Failed to send OTP"));
        }

        _otpServiceMock.Verify(x => x.SendOtpAsync(_testUser.Email!, "login"), Times.Once);
    }

    [Test]
    public async Task StartLoginAsync_NormalizesIdentifierToLowercase()
    {
        // Arrange
        var mixedCasePassword = "MixedCasePass123!";
        var hasher = new PasswordHasher<UserEntity>();
        var mixedCasePasswordHash = hasher.HashPassword(null!, mixedCasePassword);

        var mixedCaseUser = new UserEntity
        {
            Id = Guid.NewGuid(),
            Username = "mixedcaseuser",
            Email = "mixedcase@example.com",
            PasswordHash = mixedCasePasswordHash,
            Firstname = "Mixed",
            Lastname = "Case",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTime.UtcNow,
        };

        Context.Users.Add(mixedCaseUser);
        await Context.SaveChangesAsync();

        var request = new StartLoginRequest
        {
            Identifier = "MixedCase@Example.COM",
            Password = mixedCasePassword,
        };

        var expectedOtpResponse = new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(10) };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(mixedCaseUser.Email!, "login"))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _otpServiceMock.Verify(x => x.SendOtpAsync("mixedcase@example.com", "login"), Times.Once);
    }

    #endregion

    #region CompleteLoginAsync Tests

    [Test]
    public async Task CompleteLoginAsync_WithValidOtp_CreatesTokensAndReturnsAuthResult()
    {
        // Arrange
        var request = new CompleteLoginRequest { Identifier = "test@example.com", Otp = "123456" };

        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);

        // Setup OTP verification
        _otpServiceMock
            .Setup(x => x.VerifyOtp(_testUser.Email!, request.Otp, "login"))
            .Returns(Result.NoContent());

        // Setup token creation
        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(AuthConfig.RefreshTokenValidForDays))
            .Returns(
                new TokenDetails { Value = "refresh_token_456", ExpiresAt = refreshTokenExpiresAt }
            );

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(_testUser, AuthConfig.AccessTokenValidForMinutes))
            .Returns(
                new TokenDetails { Value = "access_token_123", ExpiresAt = accessTokenExpiresAt }
            );

        _tokenServiceMock
            .Setup(x => x.HashToken("refresh_token_456"))
            .Returns("hashed_refresh_token");

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
        }

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Content.AccessToken, Is.EqualTo("access_token_123"));
            Assert.That(result.Content.RefreshToken, Is.EqualTo("refresh_token_456"));
            Assert.That(result.Content.AccessTokenExpiresAt, Is.EqualTo(accessTokenExpiresAt));
            Assert.That(result.Content.RefreshTokenExpiresAt, Is.EqualTo(refreshTokenExpiresAt));
        }

        // Verify refresh token was stored in database
        var refreshTokenExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == "hashed_refresh_token" && rt.UserId == _testUser.Id
        );
        Assert.That(refreshTokenExists, Is.True);

        _otpServiceMock.Verify(x => x.VerifyOtp(_testUser.Email!, "123456", "login"), Times.Once);
        _tokenServiceMock.Verify(
            x => x.CreateRefreshToken(AuthConfig.RefreshTokenValidForDays),
            Times.Once
        );
        _tokenServiceMock.Verify(
            x => x.CreateAccessToken(_testUser, AuthConfig.AccessTokenValidForMinutes),
            Times.Once
        );
    }

    [Test]
    public async Task CompleteLoginAsync_WithValidUsernameAndOtp_CreatesTokensAndReturnsAuthResult()
    {
        // Arrange
        var request = new CompleteLoginRequest
        {
            Identifier = "testuser", // Using username instead of email
            Otp = "123456",
        };

        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);

        // Setup OTP verification
        _otpServiceMock
            .Setup(x => x.VerifyOtp(_testUser.Email!, request.Otp, "login"))
            .Returns(Result.NoContent());

        // Setup token creation
        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(AuthConfig.RefreshTokenValidForDays))
            .Returns(
                new TokenDetails { Value = "refresh_token_456", ExpiresAt = refreshTokenExpiresAt }
            );

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(_testUser, AuthConfig.AccessTokenValidForMinutes))
            .Returns(
                new TokenDetails { Value = "access_token_123", ExpiresAt = accessTokenExpiresAt }
            );

        _tokenServiceMock
            .Setup(x => x.HashToken("refresh_token_456"))
            .Returns("hashed_refresh_token");

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Content, Is.Not.Null);

        // Verify the correct user was found by username
        _otpServiceMock.Verify(x => x.VerifyOtp(_testUser.Email!, "123456", "login"), Times.Once);
    }

    [Test]
    public async Task CompleteLoginAsync_WithInvalidOtp_ReturnsBadRequest()
    {
        // Arrange
        var request = new CompleteLoginRequest
        {
            Identifier = "test@example.com",
            Otp = "wrongotp",
        };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(_testUser.Email!, request.Otp, "login"))
            .Returns(Result.BadRequest("Invalid or expired verification code"));

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("Invalid or expired verification code"));
        }

        // Verify no tokens were created
        _tokenServiceMock.Verify(x => x.CreateRefreshToken(It.IsAny<int>()), Times.Never);
        _tokenServiceMock.Verify(
            x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()),
            Times.Never
        );
    }

    [Test]
    public async Task CompleteLoginAsync_WithNonExistentUser_ReturnsBadRequest()
    {
        // Arrange
        var request = new CompleteLoginRequest
        {
            Identifier = "nonexistent@example.com",
            Otp = "123456",
        };

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("Invalid or expired verification code"));
        }

        // Verify OTP verification was not attempted
        _otpServiceMock.Verify(
            x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never
        );
    }

    [Test]
    public async Task CompleteLoginAsync_NormalizesIdentifierToLowercase()
    {
        // Arrange
        var mixedCaseUser = new UserEntity
        {
            Id = Guid.NewGuid(),
            Username = "mixedcaseuser",
            Email = "mixedcase@example.com",
            PasswordHash = _hashedCorrectPassword,
            Firstname = "Mixed",
            Lastname = "Case",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTime.UtcNow,
        };

        Context.Users.Add(mixedCaseUser);
        await Context.SaveChangesAsync();

        var request = new CompleteLoginRequest
        {
            Identifier = "MixedCase@Example.COM",
            Otp = "123456",
        };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(mixedCaseUser.Email!, request.Otp, "login"))
            .Returns(Result.NoContent());

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<int>()))
            .Returns(
                new TokenDetails { Value = "refresh_token", ExpiresAt = DateTime.UtcNow.AddDays(7) }
            );

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new TokenDetails
                {
                    Value = "access_token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(30),
                }
            );

        _tokenServiceMock.Setup(x => x.HashToken(It.IsAny<string>())).Returns("hashed_token");

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _otpServiceMock.Verify(
            x => x.VerifyOtp("mixedcase@example.com", "123456", "login"),
            Times.Once
        );
    }

    #endregion
}
