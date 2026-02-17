using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.LoginServices;
using Hobbyist.Api.Services.OtpServices;
using Hobbyist.Api.Services.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Hobbyist.Tests;

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
        var hasher = new PasswordHasher<UserEntity>();
        _hashedCorrectPassword = hasher.HashPassword(null!, _correctPassword);

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
        _otpServiceMock = new Mock<IOtpService>();
        _tokenServiceMock = new Mock<ITokenService>();
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
            Password = _correctPassword,
        };

        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(OtpConfig.OtpValidForMinutes),
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
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

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(_testUser.Email, LoginConfig.LoginPurpose),
            Times.Once
        );
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

        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(OtpConfig.OtpValidForMinutes),
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
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

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(_testUser.Email, LoginConfig.LoginPurpose),
            Times.Once
        );
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
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidLoginCredentials));
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
            Password = "WrongPassword123!",
        };

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidLoginCredentials));
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
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result<OtpResponse>.BadRequest(ErrorMessages.UnexpectedError));

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.UnexpectedError));
        }

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(_testUser.Email, LoginConfig.LoginPurpose),
            Times.Once
        );
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

        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(OtpConfig.OtpValidForMinutes),
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _otpServiceMock.Verify(
            x => x.SendOtpAsync(mixedCaseUser.Email, LoginConfig.LoginPurpose),
            Times.Once
        );
    }

    #endregion

    #region CompleteLoginAsync Tests

    [Test]
    public async Task CompleteLoginAsync_WithValidEmailandOtp_CreatesTokensAndReturnsAuthResult()
    {
        // Arrange
        var request = new CompleteLoginRequest { Identifier = "test@example.com", Otp = "123456" };

        var accessToken = "access_token";
        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(
            TokenConfig.AccessTokenValidForMinutes
        );
        var refreshToken = "refresh_token";
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(TokenConfig.RefreshTokenValidForDays);

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.NoContent());

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<int>()))
            .Returns(new TokenDetails { Value = refreshToken, ExpiresAt = refreshTokenExpiresAt });

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(new TokenDetails { Value = accessToken, ExpiresAt = accessTokenExpiresAt });

        _tokenServiceMock
            .Setup(x => x.HashToken(It.IsAny<string>()))
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
            Assert.That(result.Content.AccessToken, Is.EqualTo(accessToken));
            Assert.That(result.Content.RefreshToken, Is.EqualTo(refreshToken));
            Assert.That(result.Content.AccessTokenExpiresAt, Is.EqualTo(accessTokenExpiresAt));
            Assert.That(result.Content.RefreshTokenExpiresAt, Is.EqualTo(refreshTokenExpiresAt));
        }

        var refreshTokenExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == "hashed_refresh_token" && rt.UserId == _testUser.Id
        );
        Assert.That(refreshTokenExists, Is.True);

        _otpServiceMock.Verify(
            x => x.VerifyOtp(_testUser.Email, request.Otp, LoginConfig.LoginPurpose),
            Times.Once
        );
        _tokenServiceMock.Verify(
            x => x.CreateRefreshToken(TokenConfig.RefreshTokenValidForDays),
            Times.Once
        );
        _tokenServiceMock.Verify(
            x => x.CreateAccessToken(_testUser, TokenConfig.AccessTokenValidForMinutes),
            Times.Once
        );
        _tokenServiceMock.Verify(x => x.HashToken(refreshToken), Times.Once);
    }

    [Test]
    public async Task CompleteLoginAsync_WithValidUsernameAndOtp_CreatesTokensAndReturnsAuthResult()
    {
        // Arrange
        var request = new CompleteLoginRequest { Identifier = "testuser", Otp = "123456" };

        var accessToken = "access_token";
        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(
            TokenConfig.AccessTokenValidForMinutes
        );
        var refreshToken = "refresh_token";
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(TokenConfig.RefreshTokenValidForDays);

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.NoContent());

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<int>()))
            .Returns(new TokenDetails { Value = refreshToken, ExpiresAt = refreshTokenExpiresAt });

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(new TokenDetails { Value = accessToken, ExpiresAt = accessTokenExpiresAt });

        _tokenServiceMock
            .Setup(x => x.HashToken(It.IsAny<string>()))
            .Returns("hashed_refresh_token");

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content, Is.Not.Null);
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp(_testUser.Email!, request.Otp, LoginConfig.LoginPurpose),
            Times.Once
        );
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
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.BadRequest(ErrorMessages.InvalidOrExpiredOtp));

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidOrExpiredOtp));
        }

        _tokenServiceMock.Verify(x => x.CreateRefreshToken(It.IsAny<int>()), Times.Never);
        _tokenServiceMock.Verify(
            x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()),
            Times.Never
        );
        _tokenServiceMock.Verify(x => x.HashToken(It.IsAny<string>()), Times.Never);
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
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidOrExpiredOtp));
        }

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
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.NoContent());

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<int>()))
            .Returns(
                new TokenDetails
                {
                    Value = "refresh_token",
                    ExpiresAt = DateTime.UtcNow.AddDays(TokenConfig.RefreshTokenValidForDays),
                }
            );

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new TokenDetails
                {
                    Value = "access_token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TokenConfig.AccessTokenValidForMinutes),
                }
            );

        _tokenServiceMock.Setup(x => x.HashToken(It.IsAny<string>())).Returns("hashed_token");

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _otpServiceMock.Verify(
            x => x.VerifyOtp(mixedCaseUser.Email, request.Otp, LoginConfig.LoginPurpose),
            Times.Once
        );
    }

    #endregion
}
