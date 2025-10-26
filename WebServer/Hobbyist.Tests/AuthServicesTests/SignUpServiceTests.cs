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

        var expectedOtpResponse = new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(10) };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(request.Email.ToLower(), "signup"))
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _signUpService.StartSignUpAsync(request);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
        }
        Assert.That(result.Content.OtpExpiresAt, Is.EqualTo(expectedOtpResponse.OtpExpiresAt));

        _otpServiceMock.Verify(x => x.SendOtpAsync(request.Email.ToLower(), "signup"), Times.Once);
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

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
            Assert.That(result.Message, Is.EqualTo("Email taken"));
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
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
        Assert.That(result.Message, Is.EqualTo("Email taken"));

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
            .Setup(x => x.SendOtpAsync(request.Email.ToLower(), "signup"))
            .ReturnsAsync(Result<OtpResponse>.BadRequest("Failed to send OTP"));

        // Act
        var result = await _signUpService.StartSignUpAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        Assert.That(result.Message, Is.EqualTo("Failed to send OTP"));

        _otpServiceMock.Verify(x => x.SendOtpAsync(request.Email.ToLower(), "signup"), Times.Once);
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

        var expectedOtpResponse = new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(10) };

        string? capturedEmail = null;

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string>((email, purpose) => capturedEmail = email)
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _signUpService.StartSignUpAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(capturedEmail, Is.EqualTo("mixedcase@example.com"));
        _otpServiceMock.Verify(x => x.SendOtpAsync("mixedcase@example.com", "signup"), Times.Once);
    }

    #endregion

    #region VerifyOtp Tests

    [Test]
    public void VerifyOtp_WithValidOtp_ReturnsSuccess()
    {
        // Arrange
        var request = new VerifyOtpRequest { Email = "test@example.com", Otp = "123456" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(request.Email.ToLower(), request.Otp, "signup"))
            .Returns(Result.NoContent()); // OtpService returns NoContent() on success

        // Act
        var result = _signUpService.VerifyOtp(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NoContent)); // Should be NoContent, not Success
            Assert.That(result.Message, Is.Null);
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp("test@example.com", "123456", "signup"),
            Times.Once
        );
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_ReturnsBadRequest()
    {
        // Arrange
        var request = new VerifyOtpRequest { Email = "test@example.com", Otp = "wrongotp" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(request.Email.ToLower(), request.Otp, "signup"))
            .Returns(Result.BadRequest("Invalid or expired verification code"));

        // Act
        var result = _signUpService.VerifyOtp(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("Invalid or expired verification code"));
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp("test@example.com", "wrongotp", "signup"),
            Times.Once
        );
    }

    [Test]
    public void VerifyOtp_WithExpiredOtp_ReturnsBadRequest()
    {
        // Arrange
        var request = new VerifyOtpRequest { Email = "test@example.com", Otp = "expiredotp" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp(request.Email.ToLower(), request.Otp, "signup"))
            .Returns(Result.BadRequest("Invalid or expired verification code"));

        // Act
        var result = _signUpService.VerifyOtp(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("Invalid or expired verification code"));
        }

        _otpServiceMock.Verify(
            x => x.VerifyOtp("test@example.com", "expiredotp", "signup"),
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
            x => x.VerifyOtp("mixedcase@example.com", "123456", "signup"),
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
        var expectedOtpResponse = new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(10) };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(request.Email.ToLower(), "signup"))
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
        Assert.That(result.Content.OtpExpiresAt, Is.EqualTo(expectedOtpResponse.OtpExpiresAt));

        _otpServiceMock.Verify(x => x.SendOtpAsync("test@example.com", "signup"), Times.Once);
    }

    [Test]
    public async Task ResendOtpAsync_WhenEmailServiceFails_ReturnsFailure()
    {
        // Arrange
        var request = new ResendOtpRequest { Email = "test@example.com" };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(request.Email.ToLower(), "signup"))
            .ReturnsAsync(Result<OtpResponse>.BadRequest("Failed to send email"));

        // Act
        var result = await _signUpService.ResendOtpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("Failed to send email"));
        }

        _otpServiceMock.Verify(x => x.SendOtpAsync("test@example.com", "signup"), Times.Once);
    }

    [Test]
    public async Task ResendOtpAsync_WhenOtpServiceReturnsOtherErrors_PropagatesError()
    {
        // Arrange
        var request = new ResendOtpRequest { Email = "test@example.com" };

        _otpServiceMock
            .Setup(x => x.SendOtpAsync(request.Email.ToLower(), "signup"))
            .ReturnsAsync(Result<OtpResponse>.InternalServerError("Email service unavailable"));

        // Act
        var result = await _signUpService.ResendOtpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
            Assert.That(result.Message, Is.EqualTo("Email service unavailable"));
        }

        _otpServiceMock.Verify(x => x.SendOtpAsync("test@example.com", "signup"), Times.Once);
    }

    [Test]
    public async Task ResendOtpAsync_NormalizesEmailToLowercase()
    {
        // Arrange
        var request = new ResendOtpRequest { Email = "MixedCase@Example.COM" };
        var expectedOtpResponse = new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(10) };

        string? capturedEmail = null;
        _otpServiceMock
            .Setup(x => x.SendOtpAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string>((email, purpose) => capturedEmail = email)
            .ReturnsAsync(Result<OtpResponse>.Success(expectedOtpResponse));

        // Act
        var result = await _signUpService.ResendOtpAsync(request);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(capturedEmail, Is.EqualTo("mixedcase@example.com"));
        }
        _otpServiceMock.Verify(x => x.SendOtpAsync("mixedcase@example.com", "signup"), Times.Once);
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

        var accessTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);

        // Setup OTP verification
        _otpServiceMock.Setup(x => x.IsVerified(request.Email.ToLower(), "signup")).Returns(true);

        // Setup token creation - using TokenDetails as returned by JwtService
        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(AuthConfig.RefreshTokenValidForDays))
            .Returns(
                new TokenDetails { Value = "refresh_token_456", ExpiresAt = refreshTokenExpiresAt }
            );

        _tokenServiceMock
            .Setup(x =>
                x.CreateAccessToken(It.IsAny<UserEntity>(), AuthConfig.AccessTokenValidForMinutes)
            )
            .Returns(
                new TokenDetails { Value = "access_token_123", ExpiresAt = accessTokenExpiresAt }
            );

        _tokenServiceMock
            .Setup(x => x.HashToken("refresh_token_456"))
            .Returns("hashed_refresh_token");

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
            Assert.That(result.Content.AccessToken, Is.EqualTo("access_token_123"));
            Assert.That(result.Content.RefreshToken, Is.EqualTo("refresh_token_456"));
            Assert.That(result.Content.AccessTokenExpiresAt, Is.EqualTo(accessTokenExpiresAt));
            Assert.That(result.Content.RefreshTokenExpiresAt, Is.EqualTo(refreshTokenExpiresAt));
        }

        // Verify user was created in database
        var createdUser = await Context.Users.FirstOrDefaultAsync(u =>
            u.Email == "newuser@example.com"
        );
        Assert.That(createdUser, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(createdUser.Username, Is.EqualTo("newuser"));
            Assert.That(createdUser.Firstname, Is.EqualTo("John"));
            Assert.That(createdUser.Lastname, Is.EqualTo("Doe"));
            Assert.That(createdUser.DateOfBirth, Is.EqualTo(new DateOnly(1990, 1, 1)));
        }

        // Verify refresh token was stored
        var refreshTokenExists = await Context.RefreshTokens.AnyAsync(rt =>
            rt.TokenHash == "hashed_refresh_token"
        );
        Assert.That(refreshTokenExists, Is.True);

        // Verify OTP verification was cleared
        _otpServiceMock.Verify(
            x => x.ClearVerification("newuser@example.com", "signup"),
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

        _otpServiceMock.Setup(x => x.IsVerified(request.Email.ToLower(), "signup")).Returns(false);

        // Act
        var result = await _signUpService.CompleteSignUpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo("Email verification required"));
        }

        // Verify no user was created
        var userExists = await Context.Users.AnyAsync(u => u.Email == "newuser@example.com");
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

        _otpServiceMock.Setup(x => x.IsVerified(request.Email.ToLower(), "signup")).Returns(true);

        // Act
        var result = await _signUpService.CompleteSignUpAsync(request);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
            Assert.That(result.Message, Is.EqualTo("Email taken"));
        }

        // Verify verification was cleared due to conflict
        _otpServiceMock.Verify(
            x => x.ClearVerification("existing@example.com", "signup"),
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

        _otpServiceMock.Setup(x => x.IsVerified("mixedcase@example.com", "signup")).Returns(true);

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
        var result = await _signUpService.CompleteSignUpAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);

        // Verify user was created with normalized email and username
        var createdUser = await Context.Users.FirstOrDefaultAsync(u =>
            u.Email == "mixedcase@example.com"
        );
        Assert.That(createdUser, Is.Not.Null);
        Assert.That(createdUser.Username, Is.EqualTo("mixedcaseuser"));
        Assert.That(createdUser.Email, Is.EqualTo("mixedcase@example.com"));
    }

    #endregion
}
