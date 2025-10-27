using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.SignUpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class SignUpServiceTests : DatabaseTestBase
{
    private SignUpService _signUpService = null!;
    private Mock<IOtpService> _otpServiceMock = null!;
    private Mock<ITokenService> _tokenServiceMock = null!;

    protected override Task OnSetUpAsync()
    {
        // Setup mock services
        _otpServiceMock = new Mock<IOtpService>();
        _tokenServiceMock = new Mock<ITokenService>();

        // Create service instance with real DbContext and mock dependencies
        _signUpService = new SignUpService(
            Context,
            _otpServiceMock.Object,
            _tokenServiceMock.Object
        );

        return Task.CompletedTask;
    }

    #region StartSignUpAsync Tests

    [Test]
    public async Task StartSignUpAsync_WithNewUser_ReturnsOtpResponse()
    {
        // Arrange
        var request = new StartSignUpRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
        };

        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(AuthConfig.OtpValidForMinutes),
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _signUpService.StartSignUpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
        }
        Assert.That(result.Content, Is.EqualTo(expectedOtpResponse));

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(request.Email.ToLower(), AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public async Task StartSignUpAsync_WithExistingEmail_ReturnsConflict()
    {
        // Arrange - Create existing user in database
        var existingUser = new UserEntity
        {
            Id = Guid.NewGuid(),
            Username = "existinguser",
            Email = "existing@example.com",
            PasswordHash = "hashed_password",
            Firstname = "Existing",
            Lastname = "User",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTime.UtcNow,
        };

        Context.Users.Add(existingUser);
        await Context.SaveChangesAsync();

        var request = new StartSignUpRequest
        {
            Username = "newuser", // Different username but same email
            Email = "existing@example.com", // Existing email
        };

        // Act
        var result = await _signUpService.StartSignUpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.EmailTaken));
        }

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never
        );
    }

    [Test]
    public async Task StartSignUpAsync_WithExistingUsername_ReturnsConflict()
    {
        // Arrange - Create existing user in database
        var existingUser = new UserEntity
        {
            Id = Guid.NewGuid(),
            Username = "existinguser",
            Email = "existing@example.com",
            PasswordHash = "hashed_password",
            Firstname = "Existing",
            Lastname = "User",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTime.UtcNow,
        };

        Context.Users.Add(existingUser);
        await Context.SaveChangesAsync();

        var request = new StartSignUpRequest
        {
            Username = "existinguser", // Existing username
            Email = "newemail@example.com", // Different email
        };

        // Act
        var result = await _signUpService.StartSignUpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.EmailTaken));
        }

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()),
            Times.Never
        );
    }

    [Test]
    public async Task StartSignUpAsync_OtpServiceFails_ReturnsFailureResult()
    {
        // Arrange
        var request = new StartSignUpRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result<OtpResponse>.InternalServerError(ErrorMessages.UnexpectedError));

        // Act
        var result = await _signUpService.StartSignUpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.UnexpectedError));
        }

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(request.Email.ToLower(), AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public async Task StartSignUpAsync_NormalizesEmailAndUsernameToLowercase()
    {
        // Arrange
        var request = new StartSignUpRequest
        {
            Username = "MixedCaseUser",
            Email = "MixedCase@Example.COM",
        };

        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(AuthConfig.OtpValidForMinutes),
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _signUpService.StartSignUpAsync(request);

        // Assert
        _otpServiceMock.Verify(
            x => x.SendOtpAsync(request.Email.ToLower(), AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    #endregion

    #region VerifyOtp Tests

    [Test]
    public void VerifyOtp_WithValidOtp_ReturnsSuccess()
    {
        // Arrange
        var request = new VerifyOtpRequest { Email = "test@example.com", Otp = "123456" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.NoContent());

        // Act
        var result = _signUpService.VerifyOtp(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NoContent));
            Assert.That(result.Message, Is.Null);
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp(request.Email, request.Otp, AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_ReturnsBadRequest()
    {
        // Arrange
        var request = new VerifyOtpRequest { Email = "test@example.com", Otp = "wrongotp" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.BadRequest(ErrorMessages.InvalidOrExpiredOtp));

        // Act
        var result = _signUpService.VerifyOtp(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidOrExpiredOtp));
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp(request.Email, request.Otp, AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public void VerifyOtp_WithExpiredOtp_ReturnsBadRequest()
    {
        // Arrange
        var request = new VerifyOtpRequest { Email = "test@example.com", Otp = "expiredotp" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.BadRequest(ErrorMessages.InvalidOrExpiredOtp));

        // Act
        var result = _signUpService.VerifyOtp(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidOrExpiredOtp));
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp(request.Email, request.Otp, AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public void VerifyOtp_NormalizesEmailToLowercase()
    {
        // Arrange
        var request = new VerifyOtpRequest { Email = "MixedCase@Example.COM", Otp = "123456" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Result.NoContent());

        // Act
        var result = _signUpService.VerifyOtp(request);

        // Assert
        _otpServiceMock.Verify(
            x => x.VerifyOtp(request.Email.ToLower(), request.Otp, AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    #endregion

    #region ResendOtpAsync Tests

    [Test]
    public async Task ResendOtpAsync_WithValidEmail_ReturnsOtpResponse()
    {
        // Arrange
        var request = new ResendOtpRequest { Email = "test@example.com" };
        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(AuthConfig.OtpValidForMinutes),
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _signUpService.ResendOtpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
        }
        Assert.That(result.Content, Is.EqualTo(expectedOtpResponse));

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(request.Email, AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public async Task ResendOtpAsync_WhenOtpServiceFails_ReturnsFailureResult()
    {
        // Arrange
        var request = new ResendOtpRequest { Email = "test@example.com" };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result<OtpResponse>.InternalServerError(ErrorMessages.UnexpectedError));

        // Act
        var result = await _signUpService.ResendOtpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.UnexpectedError));
        }

        _otpServiceMock.Verify(
            x => x.SendOtpAsync(request.Email, AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public async Task ResendOtpAsync_NormalizesEmailToLowercase()
    {
        // Arrange
        var request = new ResendOtpRequest { Email = "MixedCase@Example.COM" };
        var expectedOtpResponse = new OtpResponse
        {
            OtpExpiresAt = DateTime.UtcNow.AddMinutes(AuthConfig.OtpValidForMinutes),
        };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _signUpService.ResendOtpAsync(request);

        // Assert
        _otpServiceMock.Verify(
            x => x.SendOtpAsync(request.Email.ToLower(), AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    #endregion

    #region CompleteSignUpAsync Tests

    [Test]
    public async Task CompleteSignUpAsync_WithVerifiedEmail_CreatesUserAndReturnsTokens()
    {
        // Arrange
        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
            Password = "Password123!",
            Firstname = "John",
            Lastname = "Doe",
            DateOfBirth = "1990-01-01",
        };

        var accessToken = "access_token";
        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(
            AuthConfig.AccessTokenValidForMinutes
        );
        var refreshToken = "refresh_token";
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(AuthConfig.RefreshTokenValidForDays);
        var hashedRefreshToken = "hashed_refresh_token";

        // Setup OTP verification
        _otpServiceMock
            .Setup(x => x.IsVerified(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        // Setup token creation
        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<int>()))
            .Returns(new TokenDetails { Value = refreshToken, ExpiresAt = refreshTokenExpiresAt });

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(new TokenDetails { Value = accessToken, ExpiresAt = accessTokenExpiresAt });

        _tokenServiceMock.Setup(x => x.HashToken(It.IsAny<string>())).Returns(hashedRefreshToken);

        // Act
        var result = await _signUpService.CompleteSignUpAsync(request);

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

        // Verify user was created in database
        var createdUser = await Context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        Assert.That(createdUser, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(createdUser.Username, Is.EqualTo(request.Username));
            Assert.That(createdUser.Firstname, Is.EqualTo(request.Firstname));
            Assert.That(createdUser.Lastname, Is.EqualTo(request.Lastname));
            Assert.That(createdUser.PasswordHash, Is.Not.EqualTo(request.Password));
            Assert.That(createdUser.PasswordHash, Is.Not.Null.Or.Empty);
            Assert.That(createdUser.DateOfBirth, Is.EqualTo(DateOnly.Parse(request.DateOfBirth)));
            Assert.That(createdUser.CreatedAt, Is.EqualTo(DateTime.UtcNow).Within(5).Seconds);
        }

        // Verify refresh token was stored
        var refreshTokenExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == hashedRefreshToken
        );
        Assert.That(refreshTokenExists, Is.True);

        // Verify OTP verification was cleared
        _otpServiceMock.Verify(
            x => x.ClearVerification(request.Email, AuthConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public async Task CompleteSignUpAsync_WithoutVerifiedEmail_ReturnsBadRequest()
    {
        // Arrange
        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
            Password = "Password123!",
            Firstname = "John",
            Lastname = "Doe",
            DateOfBirth = "1990-01-01",
        };

        _otpServiceMock
            .Setup(x => x.IsVerified(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(false);

        // Act
        var result = await _signUpService.CompleteSignUpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.EmailVerificationRequired));
        }

        // Verify no user was created
        var userExists = await Context.Users.AnyAsync(u => u.Email == request.Email);
        Assert.That(userExists, Is.False);

        // Verify no tokens were created
        _tokenServiceMock.Verify(x => x.CreateRefreshToken(It.IsAny<int>()), Times.Never);
        _tokenServiceMock.Verify(
            x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()),
            Times.Never
        );
    }

    [Test]
    public async Task CompleteSignUpAsync_WithExistingUser_ReturnsConflictAndClearsVerification()
    {
        // Arrange - Create existing user
        var existingUser = new UserEntity
        {
            Id = Guid.NewGuid(),
            Username = "existinguser",
            Email = "existing@example.com",
            PasswordHash = "hashed_password",
            Firstname = "Existing",
            Lastname = "User",
            DateOfBirth = new DateOnly(1990, 1, 1),
            CreatedAt = DateTime.UtcNow,
        };

        Context.Users.Add(existingUser);
        await Context.SaveChangesAsync();

        var request = new CompleteSignUpRequest
        {
            Username = "existinguser", // Existing username
            Email = "existing@example.com", // Existing email
            Password = "Password123!",
            Firstname = "John",
            Lastname = "Doe",
            DateOfBirth = "1990-01-01",
        };

        _otpServiceMock
            .Setup(x => x.IsVerified(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        // Act
        var result = await _signUpService.CompleteSignUpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.EmailTaken));
        }

        // Verify verification was cleared due to conflict
        _otpServiceMock.Verify(
            x => x.ClearVerification(request.Email, AuthConfig.SignUpPurpose),
            Times.Once
        );

        // Verify no new user was created
        var userCount = await Context.Users.CountAsync();
        Assert.That(userCount, Is.EqualTo(1)); // Only the original user
    }

    [Test]
    public async Task CompleteSignUpAsync_NormalizesEmailAndUsernameToLowercase()
    {
        // Arrange
        var request = new CompleteSignUpRequest
        {
            Username = "MixedCaseUser",
            Email = "MixedCase@Example.COM",
            Password = "Password123!",
            Firstname = "John",
            Lastname = "Doe",
            DateOfBirth = "1990-01-01",
        };
        var lowercaseEmail = request.Email.ToLower();

        _otpServiceMock
            .Setup(x => x.IsVerified(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<int>()))
            .Returns(
                new TokenDetails
                {
                    Value = "refresh_token",
                    ExpiresAt = DateTime.UtcNow.AddDays(AuthConfig.RefreshTokenValidForDays),
                }
            );

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new TokenDetails
                {
                    Value = "access_token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(AuthConfig.AccessTokenValidForMinutes),
                }
            );

        _tokenServiceMock.Setup(x => x.HashToken(It.IsAny<string>())).Returns("hashed_token");

        // Act
        var result = await _signUpService.CompleteSignUpAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);

        // Verify user was created with normalized email and username
        var createdUser = await Context.Users.FirstOrDefaultAsync(u => u.Email == lowercaseEmail);

        Assert.That(createdUser, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(createdUser.Username, Is.EqualTo(request.Username.ToLower()));
            Assert.That(createdUser.Email, Is.EqualTo(lowercaseEmail));
        }
    }

    #endregion
}
