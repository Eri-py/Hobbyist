using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.AuthServices.LoginServices;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class LoginServiceTests : AuthTestBase
{
    private LoginService _loginService = null!;

    [SetUp]
    public override void Setup()
    {
        base.Setup();
        _loginService = new LoginService(Context, EmailServiceMock.Object, TokenServiceMock.Object);
    }

    #region StartLoginAsync Tests

    [Test]
    public async Task StartLoginAsync_ValidCredentialsWithUsername_GeneratesOtpAndSendsEmail()
    {
        // Arrange
        var password = "Test@123";
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword(password)
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new StartLoginRequest { Identifier = "testuser", Password = password };

        var otpDetails = SetupOtpCreation();
        SetupSuccessfulEmailSending();

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        AssertSuccessResult(result);
        Assert.Multiple(() =>
        {
            Assert.That(
                result.Content!.OtpExpiresAt,
                Is.EqualTo(otpDetails.ExpiresAt.ToString("o"))
            );
            Assert.That(result.Content.Email, Is.EqualTo(user.Email));
        });

        // Verify OTP was set on user
        var updatedUser = await GetUserById(user.Id);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updatedUser.Otp, Is.EqualTo(otpDetails.Value));
            Assert.That(updatedUser.OtpExpiresAt, Is.EqualTo(otpDetails.ExpiresAt));
        });

        // Verify email was sent
        EmailServiceMock.Verify(
            x => x.SendOtpEmailAsync(user.Email, user.Username, otpDetails.Value, "5 minutes"),
            Times.Once
        );
    }

    [Test]
    public async Task StartLoginAsync_ValidCredentialsWithEmail_GeneratesOtpAndSendsEmail()
    {
        // Arrange
        var password = "Test@123";
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword(password)
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new StartLoginRequest
        {
            Identifier = "TEST@TEST.COM", // Different case to test case-insensitive lookup
            Password = password,
        };

        var otpDetails = SetupOtpCreation();
        SetupSuccessfulEmailSending();

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        AssertSuccessResult(result);
        Assert.Multiple(() =>
        {
            Assert.That(
                result.Content!.OtpExpiresAt,
                Is.EqualTo(otpDetails.ExpiresAt.ToString("o"))
            );
            Assert.That(result.Content.Email, Is.EqualTo(user.Email));
        });

        // Verify OTP was set on user
        var updatedUser = await GetUserById(user.Id);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updatedUser.Otp, Is.EqualTo(otpDetails.Value));
            Assert.That(updatedUser.OtpExpiresAt, Is.EqualTo(otpDetails.ExpiresAt));
        });
    }

    [Test]
    public async Task StartLoginAsync_UserNotFound_ReturnsGenericError()
    {
        // Arrange
        var request = new StartLoginRequest
        {
            Identifier = "nonexistent@test.com",
            Password = "Test@123",
        };

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        AssertErrorResult(result, "Your login credentials don't match an account in our system.");

        var userCount = await GetUserCount();
        Assert.That(userCount, Is.EqualTo(0));
    }

    [Test]
    public async Task StartLoginAsync_IncompleteRegistration_ReturnsBadRequest()
    {
        // Arrange
        var password = "Test@123";
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword(password)
            .AsIncompleteRegistration() // User exists but registration not complete
            .Build();

        await AddUserToDatabase(user);

        var request = new StartLoginRequest { Identifier = "testuser", Password = password };

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        AssertErrorResult(
            result,
            "Account registration is not complete. Please complete your registration first."
        );
    }

    [Test]
    public async Task StartLoginAsync_InvalidPassword_ReturnsGenericError()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword("CorrectPassword@123")
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new StartLoginRequest
        {
            Identifier = "testuser",
            Password = "WrongPassword@123",
        };

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        AssertErrorResult(result, "Your login credentials don't match an account in our system.");

        // Verify user is unchanged (no OTP set)
        var unchangedUser = await GetUserById(user.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        AssertUserEquals(user, unchangedUser);
    }

    [Test]
    public async Task StartLoginAsync_EmailSendingFails_RollsBackTransaction()
    {
        // Arrange
        var password = "Test@123";
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword(password)
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new StartLoginRequest { Identifier = "testuser", Password = password };

        SetupOtpCreation();
        SetupFailedEmailSending("Email service error");

        // Act
        var result = await _loginService.StartLoginAsync(request);

        // Assert
        AssertErrorResult(result, "Email service error");

        // Verify OTP was not set (transaction rolled back)
        var unchangedUser = await GetUserById(user.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        AssertUserEquals(user, unchangedUser);
    }

    #endregion

    #region CompleteLoginAsync Tests

    [Test]
    public async Task CompleteLoginAsync_ValidOtp_ReturnsTokensAndClearsOtp()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword("Test@123")
            .WithOtp("123456", DateTime.UtcNow.AddMinutes(5))
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new CompleteLoginRequest { Identifier = "test@test.com", Otp = "123456" };

        var accessTokenDetails = SetupAccessTokenCreation();
        var refreshTokenDetails = SetupRefreshTokenCreation();
        SetupTokenHashing(refreshTokenDetails.Value, "hashed_refresh_token");

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        AssertSuccessResult(result);
        AssertAuthResult(
            result.Content!,
            accessTokenDetails.Value,
            refreshTokenDetails.Value,
            accessTokenDetails.ExpiresAt,
            refreshTokenDetails.ExpiresAt
        );

        // Verify OTP was cleared and refresh token added
        var updatedUser = await GetUserById(user.Id, includeRefreshTokens: true);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updatedUser.Otp, Is.Null);
            Assert.That(updatedUser.OtpExpiresAt, Is.Null);
            Assert.That(updatedUser.RefreshTokens, Has.Count.EqualTo(1));
        });

        var refreshToken = updatedUser.RefreshTokens.First();
        Assert.Multiple(() =>
        {
            Assert.That(refreshToken.TokenHash, Is.EqualTo("hashed_refresh_token"));
            Assert.That(refreshToken.TokenExpiresAt, Is.EqualTo(refreshTokenDetails.ExpiresAt));
            Assert.That(refreshToken.UserId, Is.EqualTo(user.Id));
        });
    }

    [Test]
    public async Task CompleteLoginAsync_InvalidOtp_ReturnsBadRequest()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword("Test@123")
            .WithOtp("123456", DateTime.UtcNow.AddMinutes(5))
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new CompleteLoginRequest
        {
            Identifier = "test@test.com",
            Otp = "654321", // Wrong OTP
        };

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        AssertErrorResult(result, "Invalid or expired verification code");

        // Verify user is unchanged
        var unchangedUser = await GetUserById(user.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        AssertUserEquals(user, unchangedUser);
    }

    [Test]
    public async Task CompleteLoginAsync_ExpiredOtp_ReturnsBadRequest()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword("Test@123")
            .WithOtp("123456", DateTime.UtcNow.AddMinutes(-1)) // Expired
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new CompleteLoginRequest { Identifier = "test@test.com", Otp = "123456" };

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        AssertErrorResult(result, "Invalid or expired verification code");

        // Verify user is unchanged
        var unchangedUser = await GetUserById(user.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        AssertUserEquals(user, unchangedUser);
    }

    [Test]
    public async Task CompleteLoginAsync_UserNotFound_ReturnsBadRequest()
    {
        // Arrange
        var request = new CompleteLoginRequest
        {
            Identifier = "nonexistent@test.com",
            Otp = "123456",
        };

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        AssertErrorResult(result, "Invalid or expired verification code");
    }

    [Test]
    public async Task CompleteLoginAsync_IncompleteRegistration_ReturnsBadRequest()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword("Test@123")
            .WithOtp("123456", DateTime.UtcNow.AddMinutes(5))
            .AsIncompleteRegistration() // Registration not complete
            .Build();

        await AddUserToDatabase(user);

        var request = new CompleteLoginRequest { Identifier = "test@test.com", Otp = "123456" };

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        AssertErrorResult(
            result,
            "Account registration is not complete. Please complete your registration first."
        );
    }

    [Test]
    public async Task CompleteLoginAsync_WithUsernameIdentifier_ReturnsTokens()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPassword("Test@123")
            .WithOtp("123456", DateTime.UtcNow.AddMinutes(5))
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new CompleteLoginRequest
        {
            Identifier = "testuser", // Using username instead of email
            Otp = "123456",
        };

        var accessTokenDetails = SetupAccessTokenCreation();
        var refreshTokenDetails = SetupRefreshTokenCreation();
        SetupTokenHashing(refreshTokenDetails.Value, "hashed_refresh_token");

        // Act
        var result = await _loginService.CompleteLoginAsync(request);

        // Assert
        AssertSuccessResult(result);
        AssertAuthResult(
            result.Content!,
            accessTokenDetails.Value,
            refreshTokenDetails.Value,
            accessTokenDetails.ExpiresAt,
            refreshTokenDetails.ExpiresAt
        );
    }

    #endregion
}
