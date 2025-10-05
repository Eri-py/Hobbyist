using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.AuthServices.RegistrationServices;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class RegistrationServiceTests : AuthTestBase
{
    private RegistrationService _registrationService = null!;

    [SetUp]
    public override void Setup()
    {
        base.Setup();
        _registrationService = new RegistrationService(
            Context,
            EmailServiceMock.Object,
            TokenServiceMock.Object
        );
    }

    #region StartRegistrationAsync Tests

    [Test]
    public async Task StartRegistrationAsync_NewUser_CreatesUserWithOtpAndSendsEmail()
    {
        // Arrange
        var request = new StartSignUpRequest { Username = "NewUser", Email = "new@test.com" };

        var otpDetails = SetupOtpCreation();
        SetupSuccessfulEmailSending();

        // Act
        var result = await _registrationService.StartRegistrationAsync(request);

        // Assert
        AssertSuccessResult(result);
        Assert.That(result.Content, Is.EqualTo(otpDetails.ExpiresAt.ToString("o")));

        var user = await GetUserById((await Context.Users.FirstAsync()).Id);
        Assert.That(user, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(user.Username, Is.EqualTo(request.Username.ToLower()));
            Assert.That(user.Email, Is.EqualTo(request.Email.ToLower()));
            Assert.That(user.Otp, Is.EqualTo(otpDetails.Value));
            Assert.That(user.OtpExpiresAt, Is.EqualTo(otpDetails.ExpiresAt));
            Assert.That(user.CreatedAt, Is.Null); // Should be null until registration is complete
        });

        // Verify email was sent
        EmailServiceMock.Verify(
            x =>
                x.SendOtpEmailAsync(
                    request.Email.ToLower(),
                    request.Username.ToLower(),
                    otpDetails.Value,
                    "5 minutes"
                ),
            Times.Once
        );
    }

    [Test]
    public async Task StartRegistrationAsync_ExistingIncompleteUser_UpdatesUserDetails()
    {
        // Arrange
        var existingUser = CreateUserBuilder()
            .WithUsername("olduser")
            .WithEmail("test@test.com")
            .WithOtp("oldotp", DateTime.UtcNow.AddMinutes(2))
            .AsIncompleteRegistration()
            .Build();

        await AddUserToDatabase(existingUser);

        var request = new StartSignUpRequest { Username = "NewUser", Email = "test@test.com" };

        var otpDetails = SetupOtpCreation("newotp");
        SetupSuccessfulEmailSending();

        // Act
        var result = await _registrationService.StartRegistrationAsync(request);

        // Assert
        AssertSuccessResult(result);

        var updatedUser = await GetUserById(existingUser.Id);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updatedUser.Username, Is.EqualTo(request.Username.ToLower()));
            Assert.That(updatedUser.Email, Is.EqualTo(request.Email.ToLower()));
            Assert.That(updatedUser.Otp, Is.EqualTo(otpDetails.Value));
            Assert.That(updatedUser.OtpExpiresAt, Is.EqualTo(otpDetails.ExpiresAt));
        });
    }

    [Test]
    public async Task StartRegistrationAsync_UsernameTaken_ReturnsConflict()
    {
        // Arrange
        var existingUser = CreateUserBuilder()
            .WithUsername("takenuser")
            .WithEmail("existing@test.com")
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(existingUser);

        var request = new StartSignUpRequest
        {
            Username = "TakenUser", // Different case to test case-insensitive check
            Email = "new@test.com",
        };

        // Act
        var result = await _registrationService.StartRegistrationAsync(request);

        // Assert
        AssertErrorResult(result, "Username taken");

        // Verify existing user is unchanged
        var unchangedUser = await GetUserById(existingUser.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        AssertUserEquals(existingUser, unchangedUser);
    }

    [Test]
    public async Task StartRegistrationAsync_EmailTaken_ReturnsConflict()
    {
        // Arrange
        var existingUser = CreateUserBuilder()
            .WithUsername("existinguser")
            .WithEmail("taken@test.com")
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(existingUser);

        var request = new StartSignUpRequest
        {
            Username = "newuser",
            Email = "Taken@test.com", // Different case to test case-insensitive check
        };

        // Act
        var result = await _registrationService.StartRegistrationAsync(request);

        // Assert
        AssertErrorResult(result, "Email taken");

        // Verify existing user is unchanged
        var unchangedUser = await GetUserById(existingUser.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        AssertUserEquals(existingUser, unchangedUser);
    }

    [Test]
    public async Task StartRegistrationAsync_EmailSendingFails_RollsBackTransaction()
    {
        // Arrange
        var request = new StartSignUpRequest { Username = "TestUser", Email = "test@test.com" };

        SetupOtpCreation();
        SetupFailedEmailSending("Email service error");

        // Act
        var result = await _registrationService.StartRegistrationAsync(request);

        // Assert
        AssertErrorResult(result, "Email service error");

        // Verify no user was created (transaction rolled back)
        var userCount = await GetUserCount();
        Assert.That(userCount, Is.EqualTo(0));
    }

    #endregion

    #region VerifyOtpAsync Tests

    [Test]
    public async Task VerifyOtpAsync_ValidOtp_ClearsOtpAndReturnsSuccess()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithEmail("test@test.com")
            .WithOtp("123456", DateTime.UtcNow.AddMinutes(5))
            .AsIncompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new VerifyOtpRequest { Email = "test@test.com", Otp = "123456" };

        // Act
        var result = await _registrationService.VerifyOtpAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);

        var updatedUser = await GetUserById(user.Id);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updatedUser.Otp, Is.Null);
            Assert.That(updatedUser.OtpExpiresAt, Is.Null);
        });
    }

    [Test]
    public async Task VerifyOtpAsync_InvalidOtp_ReturnsBadRequest()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithEmail("test@test.com")
            .WithOtp("123456", DateTime.UtcNow.AddMinutes(5))
            .AsIncompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new VerifyOtpRequest
        {
            Email = "test@test.com",
            Otp = "654321", // Wrong OTP
        };

        // Act
        var result = await _registrationService.VerifyOtpAsync(request);

        // Assert
        AssertErrorResult(result, "Invalid or expired verification code");

        // Verify user is unchanged
        var unchangedUser = await GetUserById(user.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        AssertUserEquals(user, unchangedUser);
    }

    [Test]
    public async Task VerifyOtpAsync_ExpiredOtp_ReturnsBadRequest()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithEmail("test@test.com")
            .WithOtp("123456", DateTime.UtcNow.AddMinutes(-1)) // Expired
            .AsIncompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new VerifyOtpRequest { Email = "test@test.com", Otp = "123456" };

        // Act
        var result = await _registrationService.VerifyOtpAsync(request);

        // Assert
        AssertErrorResult(result, "Invalid or expired verification code");

        // Verify user is unchanged
        var unchangedUser = await GetUserById(user.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        AssertUserEquals(user, unchangedUser);
    }

    [Test]
    public async Task VerifyOtpAsync_UserNotFound_ReturnsBadRequest()
    {
        // Arrange
        var request = new VerifyOtpRequest { Email = "nonexistent@test.com", Otp = "123456" };

        // Act
        var result = await _registrationService.VerifyOtpAsync(request);

        // Assert
        AssertErrorResult(result, "Invalid or expired verification code");
    }

    #endregion

    #region CompleteRegistrationAsync Tests

    [Test]
    public async Task CompleteRegistrationAsync_ValidUser_CompletesRegistrationAndReturnsTokens()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .AsIncompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new CompleteRegistrationRequest
        {
            Email = "test@test.com",
            Username = "testuser",
            Password = "Test@123",
            Firstname = "John",
            Lastname = "Doe",
            DateOfBirth = "1990-01-01",
        };

        var accessTokenDetails = SetupAccessTokenCreation();
        var refreshTokenDetails = SetupRefreshTokenCreation();
        SetupTokenHashing(refreshTokenDetails.Value, "hashed_refresh_token");

        // Act
        var result = await _registrationService.CompleteRegistrationAsync(request);

        // Assert
        AssertSuccessResult(result);
        AssertAuthResult(
            result.Content!,
            accessTokenDetails.Value,
            refreshTokenDetails.Value,
            accessTokenDetails.ExpiresAt,
            refreshTokenDetails.ExpiresAt
        );

        // Verify user is updated
        var updatedUser = await GetUserById(user.Id, includeRefreshTokens: true);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updatedUser.PasswordHash, Is.Not.Null);
            Assert.That(updatedUser.Firstname, Is.EqualTo(request.Firstname));
            Assert.That(updatedUser.Lastname, Is.EqualTo(request.Lastname));
            Assert.That(updatedUser.DateOfBirth, Is.EqualTo(DateOnly.Parse(request.DateOfBirth)));
            Assert.That(updatedUser.CreatedAt, Is.Not.Null);
            Assert.That(
                updatedUser.CreatedAt,
                Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5))
            );
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
    public async Task CompleteRegistrationAsync_UserNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new CompleteRegistrationRequest
        {
            Email = "nonexistent@test.com",
            Username = "nonexistent",
            Password = "Test@123",
            Firstname = "John",
            Lastname = "Doe",
            DateOfBirth = "1990-01-01",
        };

        // Act
        var result = await _registrationService.CompleteRegistrationAsync(request);

        // Assert
        AssertErrorResult(result, "User not found");

        var userCount = await GetUserCount();
        Assert.That(userCount, Is.EqualTo(0));
    }

    [Test]
    public async Task CompleteRegistrationAsync_UsernameMismatch_ReturnsNotFound()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("correctuser")
            .WithEmail("test@test.com")
            .AsIncompleteRegistration()
            .Build();

        await AddUserToDatabase(user);

        var request = new CompleteRegistrationRequest
        {
            Email = "test@test.com",
            Username = "wronguser", // Different username
            Password = "Test@123",
            Firstname = "John",
            Lastname = "Doe",
            DateOfBirth = "1990-01-01",
        };

        // Act
        var result = await _registrationService.CompleteRegistrationAsync(request);

        // Assert
        AssertErrorResult(result, "User not found");
    }

    #endregion
}
