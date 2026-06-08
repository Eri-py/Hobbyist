using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.LoginServices;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Api.Services.LoggingHashServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class LoginServiceTests : DatabaseTestBase
{
    private LoginService _loginService = null!;
    private Mock<IOtpService> _otpServiceMock = null!;
    private Mock<ITokenService> _tokenServiceMock = null!;
    private Mock<ILogHasherService> _logHasherMock = null!;
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
        _logHasherMock = new Mock<ILogHasherService>();
        _logHasherMock.Setup(x => x.Hash(It.IsAny<string?>())).Returns("hashed");
        LoggerExtensions.ConfigureHasher(_logHasherMock.Object);

        _loginService = new LoginService(
            Context,
            _otpServiceMock.Object,
            _tokenServiceMock.Object,
            NullLogger<LoginService>.Instance
        );

        return Task.CompletedTask;
    }

    private static RefreshTokenDetails BuildRefreshTokenDetails(Guid userId, string tokenValue)
    {
        var expiresAt = DateTime.UtcNow.AddDays(TokenConfig.RefreshTokenValidForDays);

        return new RefreshTokenDetails
        {
            Value = tokenValue,
            ExpiresAt = expiresAt,
            Entry = new RefreshTokenEntity
            {
                TokenHash = $"hash_{tokenValue}",
                TokenExpiresAt = expiresAt,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
            },
        };
    }

    #region StartLoginAsync Tests

    [Test]
    public async Task StartLoginAsync_WithValidEmailAndPassword_ReturnsOtpResponse()
    {
        var request = new StartLoginRequest
        {
            Identifier = "test@example.com",
            Password = _correctPassword,
        };

        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(OtpConfig.OtpLifetimeMinutes),
        };

        _otpServiceMock
            .Setup(x =>
                x.SendOtpAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        var result = await _loginService.StartLoginAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
            Assert.That(result.Content!.Email, Is.EqualTo(_testUser.Email));
            Assert.That(
                result.Content.OtpExpiresAt,
                Is.EqualTo(expectedOtpResponse.OtpExpiresAt.ToString("o"))
            );
        }

        _otpServiceMock.Verify(
            x =>
                x.SendOtpAsync(
                    _testUser.Email,
                    LoginConfig.LoginPurpose,
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    [Test]
    public async Task StartLoginAsync_WithValidUsernameAndPassword_ReturnsOtpResponse()
    {
        var request = new StartLoginRequest
        {
            Identifier = "testuser",
            Password = _correctPassword,
        };

        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(OtpConfig.OtpLifetimeMinutes),
        };

        _otpServiceMock
            .Setup(x =>
                x.SendOtpAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        var result = await _loginService.StartLoginAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
            Assert.That(result.Content!.Email, Is.EqualTo(_testUser.Email));
        }

        _otpServiceMock.Verify(
            x =>
                x.SendOtpAsync(
                    _testUser.Email,
                    LoginConfig.LoginPurpose,
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    [Test]
    public async Task StartLoginAsync_WithNonExistentUser_ReturnsNotFound()
    {
        var request = new StartLoginRequest
        {
            Identifier = "nonexistent@example.com",
            Password = "any_password",
        };

        var result = await _loginService.StartLoginAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidLoginCredentials));
        }

        _otpServiceMock.Verify(
            x =>
                x.SendOtpAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                ),
            Times.Never
        );
    }

    [Test]
    public async Task StartLoginAsync_WithIncorrectPassword_ReturnsNotFound()
    {
        var request = new StartLoginRequest
        {
            Identifier = "test@example.com",
            Password = "WrongPassword123!",
        };

        var result = await _loginService.StartLoginAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NotFound));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidLoginCredentials));
        }

        _otpServiceMock.Verify(
            x =>
                x.SendOtpAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                ),
            Times.Never
        );
    }

    [Test]
    public async Task StartLoginAsync_WhenOtpServiceFails_ReturnsError()
    {
        var request = new StartLoginRequest
        {
            Identifier = "test@example.com",
            Password = _correctPassword,
        };

        _otpServiceMock
            .Setup(x =>
                x.SendOtpAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result<OtpResponse>.BadRequest(ErrorMessages.UnexpectedError));

        var result = await _loginService.StartLoginAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.UnexpectedError));
        }

        _otpServiceMock.Verify(
            x =>
                x.SendOtpAsync(
                    _testUser.Email,
                    LoginConfig.LoginPurpose,
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    [Test]
    public async Task StartLoginAsync_NormalizesIdentifierToLowercase()
    {
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

        _otpServiceMock
            .Setup(x =>
                x.SendOtpAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(
                Result<OtpResponse>.Success(
                    new OtpResponse
                    {
                        OtpExpiresAt = DateTime.UtcNow.AddMinutes(OtpConfig.OtpLifetimeMinutes),
                    }
                )
            );

        var result = await _loginService.StartLoginAsync(request, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        _otpServiceMock.Verify(
            x =>
                x.SendOtpAsync(
                    mixedCaseUser.Email,
                    LoginConfig.LoginPurpose,
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    #endregion

    #region CompleteLoginAsync Tests

    [Test]
    public async Task CompleteLoginAsync_WithValidEmailAndOtp_ReturnsAuthResult()
    {
        var request = new CompleteLoginRequest { Identifier = "test@example.com", Otp = "123456" };

        var accessToken = "access_token";
        var accessTokenExpiresAt = DateTimeOffset.UtcNow.AddMinutes(
            TokenConfig.AccessTokenValidForMinutes
        );
        var refreshToken = "refresh_token";
        var refreshTokenDetails = BuildRefreshTokenDetails(_testUser.Id, refreshToken);

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.NoContent());

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(_testUser.Id))
            .Returns(refreshTokenDetails);

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new AccessTokenDetails { Value = accessToken, ExpiresAt = accessTokenExpiresAt }
            );

        var result = await _loginService.CompleteLoginAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
            Assert.That(result.Content!.AccessToken, Is.EqualTo(accessToken));
            Assert.That(result.Content.RefreshToken, Is.EqualTo(refreshToken));
            Assert.That(result.Content.AccessTokenExpiresAt, Is.EqualTo(accessTokenExpiresAt));
            Assert.That(
                result.Content.RefreshTokenExpiresAt,
                Is.EqualTo(refreshTokenDetails.ExpiresAt)
            );
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp(_testUser.Email, request.Otp, LoginConfig.LoginPurpose),
            Times.Once
        );
        _tokenServiceMock.Verify(x => x.CreateRefreshToken(_testUser.Id), Times.Once);
        _tokenServiceMock.Verify(
            x => x.CreateAccessToken(_testUser, TokenConfig.AccessTokenValidForMinutes),
            Times.Once
        );
    }

    [Test]
    public async Task CompleteLoginAsync_WithValidEmailAndOtp_StoresRefreshToken()
    {
        var request = new CompleteLoginRequest { Identifier = "test@example.com", Otp = "123456" };
        var refreshTokenDetails = BuildRefreshTokenDetails(_testUser.Id, "refresh_token");

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.NoContent());

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(_testUser.Id))
            .Returns(refreshTokenDetails);

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new AccessTokenDetails
                {
                    Value = "access_token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TokenConfig.AccessTokenValidForMinutes),
                }
            );

        var result = await _loginService.CompleteLoginAsync(request, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        var refreshTokenExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == refreshTokenDetails.Entry.TokenHash && rt.UserId == _testUser.Id
        );
        Assert.That(refreshTokenExists, Is.True);
    }

    [Test]
    public async Task CompleteLoginAsync_WithValidUsernameAndOtp_CreatesTokensAndReturnsAuthResult()
    {
        var request = new CompleteLoginRequest { Identifier = "testuser", Otp = "123456" };

        var accessToken = "access_token";
        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(
            TokenConfig.AccessTokenValidForMinutes
        );
        var refreshToken = "refresh_token";
        var refreshTokenDetails = BuildRefreshTokenDetails(_testUser.Id, refreshToken);

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.NoContent());

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(_testUser.Id))
            .Returns(refreshTokenDetails);

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new AccessTokenDetails { Value = accessToken, ExpiresAt = accessTokenExpiresAt }
            );

        var result = await _loginService.CompleteLoginAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content, Is.Not.Null);
            Assert.That(result.Content!.AccessToken, Is.EqualTo(accessToken));
            Assert.That(result.Content.RefreshToken, Is.EqualTo(refreshToken));
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp(_testUser.Email!, request.Otp, LoginConfig.LoginPurpose),
            Times.Once
        );
    }

    [Test]
    public async Task CompleteLoginAsync_WithInvalidOtp_ReturnsBadRequest()
    {
        var request = new CompleteLoginRequest
        {
            Identifier = "test@example.com",
            Otp = "wrongotp",
        };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.BadRequest(ErrorMessages.InvalidOrExpiredOtp));

        var result = await _loginService.CompleteLoginAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidOrExpiredOtp));
        }

        _tokenServiceMock.Verify(x => x.CreateRefreshToken(It.IsAny<Guid>()), Times.Never);
        _tokenServiceMock.Verify(
            x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()),
            Times.Never
        );
    }

    [Test]
    public async Task CompleteLoginAsync_WithNonExistentUser_ReturnsBadRequest()
    {
        var request = new CompleteLoginRequest
        {
            Identifier = "nonexistent@example.com",
            Otp = "123456",
        };

        var result = await _loginService.CompleteLoginAsync(request, CancellationToken.None);

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
            .Setup(x => x.CreateRefreshToken(mixedCaseUser.Id))
            .Returns(BuildRefreshTokenDetails(mixedCaseUser.Id, "refresh_token"));

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new AccessTokenDetails
                {
                    Value = "access_token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TokenConfig.AccessTokenValidForMinutes),
                }
            );

        var result = await _loginService.CompleteLoginAsync(request, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        _otpServiceMock.Verify(
            x => x.VerifyOtp(mixedCaseUser.Email, request.Otp, LoginConfig.LoginPurpose),
            Times.Once
        );
    }

    #endregion
}
