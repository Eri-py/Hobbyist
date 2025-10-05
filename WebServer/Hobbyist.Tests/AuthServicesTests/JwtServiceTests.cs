using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class JwtServiceTests : AuthTestBase
{
    private JwtService _jwtService = null!;
    private IConfiguration _configuration = null!;

    [SetUp]
    public override void Setup()
    {
        base.Setup();

        // Setup configuration
        var configData = new Dictionary<string, string>
        {
            ["Jwt:Secret"] = "ThisIsAVeryLongSecretKeyForTestingPurposesOnly123456789",
            ["Jwt:Issuer"] = "TestIssuer",
            ["Jwt:Audience"] = "TestAudience",
        };

        _configuration = new ConfigurationBuilder().AddInMemoryCollection(configData!).Build();

        _jwtService = new JwtService(_configuration, Context, EmailServiceMock.Object);
    }

    #region CreateOtp Tests

    [Test]
    public void CreateOtp_ReturnsValidOtpWithCorrectExpiry()
    {
        // Arrange
        var validForMinutes = 5;
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _jwtService.CreateOtp(validForMinutes);

        // Assert
        var afterCreation = DateTime.UtcNow;

        Assert.Multiple(() =>
        {
            Assert.That(result.Value, Has.Length.EqualTo(6));
            Assert.That(result.Value, Does.Match(@"^\d{6}$")); // Should be 6 digits
            Assert.That(
                result.ExpiresAt,
                Is.GreaterThan(beforeCreation.AddMinutes(validForMinutes - 0.1))
            );
            Assert.That(
                result.ExpiresAt,
                Is.LessThan(afterCreation.AddMinutes(validForMinutes + 0.1))
            );
        });
    }

    [Test]
    public void CreateOtp_MultipleCallsReturnDifferentValues()
    {
        // Act
        var otp1 = _jwtService.CreateOtp(5);
        var otp2 = _jwtService.CreateOtp(5);
        var otp3 = _jwtService.CreateOtp(5);

        // Assert
        var otpValues = new[] { otp1.Value, otp2.Value, otp3.Value };
        Assert.That(otpValues.Distinct().Count(), Is.EqualTo(3), "All OTPs should be unique");
    }

    [Test]
    [TestCase(1)]
    [TestCase(5)]
    [TestCase(15)]
    [TestCase(60)]
    public void CreateOtp_DifferentValidityPeriods_ReturnsCorrectExpiry(int validForMinutes)
    {
        // Arrange
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _jwtService.CreateOtp(validForMinutes);

        // Assert
        var afterCreation = DateTime.UtcNow;
        var expectedExpiry = beforeCreation.AddMinutes(validForMinutes);

        Assert.That(result.ExpiresAt, Is.EqualTo(expectedExpiry).Within(TimeSpan.FromSeconds(1)));
    }

    #endregion

    #region CreateAccessToken Tests

    [Test]
    public void CreateAccessToken_ValidUser_ReturnsValidJwtToken()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithPersonalInfo("John", "Doe")
            .AsCompleteRegistration()
            .Build();

        var validForMinutes = 15;
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _jwtService.CreateAccessToken(user, validForMinutes);

        // Assert
        var afterCreation = DateTime.UtcNow;

        Assert.Multiple(() =>
        {
            Assert.That(result.Value, Is.Not.Null.And.Not.Empty);
            Assert.That(
                result.ExpiresAt,
                Is.GreaterThan(beforeCreation.AddMinutes(validForMinutes - 0.1))
            );
            Assert.That(
                result.ExpiresAt,
                Is.LessThan(afterCreation.AddMinutes(validForMinutes + 0.1))
            );
        });

        // Verify JWT token structure and claims
        var tokenHandler = new JwtSecurityTokenHandler();
        Assert.That(tokenHandler.CanReadToken(result.Value), Is.True);

        var jsonToken = tokenHandler.ReadJwtToken(result.Value);

        Assert.Multiple(() =>
        {
            Assert.That(
                jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value,
                Is.EqualTo(user.Id.ToString())
            );
            Assert.That(
                jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value,
                Is.EqualTo(user.Username)
            );
            Assert.That(
                jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value,
                Is.EqualTo(user.Email)
            );
            Assert.That(
                jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.GivenName)?.Value,
                Is.EqualTo(user.Firstname)
            );
            Assert.That(
                jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Surname)?.Value,
                Is.EqualTo(user.Lastname)
            );
            Assert.That(jsonToken.Issuer, Is.EqualTo("TestIssuer"));
            Assert.That(jsonToken.Audiences.First(), Is.EqualTo("TestAudience"));
        });
    }

    [Test]
    public void CreateAccessToken_ValidatesTokenSignature()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithPersonalInfo("John", "Doe")
            .AsCompleteRegistration()
            .Build();

        // Act
        var result = _jwtService.CreateAccessToken(user, 15);

        // Assert - Verify the token can be validated with the same secret
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

        // This should not throw an exception
        Assert.DoesNotThrow(() =>
        {
            tokenHandler.ValidateToken(result.Value, validationParameters, out _);
        });
    }

    [Test]
    [TestCase(1)]
    [TestCase(15)]
    [TestCase(60)]
    [TestCase(1440)] // 24 hours
    public void CreateAccessToken_DifferentValidityPeriods_ReturnsCorrectExpiry(int validForMinutes)
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithPersonalInfo("John", "Doe")
            .AsCompleteRegistration()
            .Build();
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _jwtService.CreateAccessToken(user, validForMinutes);

        // Assert
        var expectedExpiry = beforeCreation.AddMinutes(validForMinutes);
        Assert.That(result.ExpiresAt, Is.EqualTo(expectedExpiry).Within(TimeSpan.FromSeconds(1)));

        // Verify the JWT token's expiry claim matches
        var tokenHandler = new JwtSecurityTokenHandler();
        var jsonToken = tokenHandler.ReadJwtToken(result.Value);
        var tokenExpiry = DateTimeOffset
            .FromUnixTimeSeconds(long.Parse(jsonToken.Claims.First(c => c.Type == "exp").Value))
            .DateTime;

        Assert.That(tokenExpiry, Is.EqualTo(result.ExpiresAt).Within(TimeSpan.FromSeconds(1)));
    }

    #endregion

    #region CreateRefreshToken Tests

    [Test]
    public void CreateRefreshToken_ReturnsValidTokenWithCorrectExpiry()
    {
        // Arrange
        var validForDays = 7;
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _jwtService.CreateRefreshToken(validForDays);

        // Assert
        var afterCreation = DateTime.UtcNow;

        Assert.Multiple(() =>
        {
            Assert.That(result.Value, Has.Length.EqualTo(64));
            Assert.That(result.Value, Does.Match(@"^[A-Za-z0-9]{64}$")); // Should be 64 alphanumeric chars
            Assert.That(
                result.ExpiresAt,
                Is.GreaterThan(beforeCreation.AddDays(validForDays - 0.01))
            );
            Assert.That(result.ExpiresAt, Is.LessThan(afterCreation.AddDays(validForDays + 0.01)));
        });
    }

    [Test]
    public void CreateRefreshToken_MultipleCallsReturnUniqueTokens()
    {
        // Act
        var tokens = Enumerable
            .Range(0, 10)
            .Select(_ => _jwtService.CreateRefreshToken(7).Value)
            .ToList();

        // Assert
        Assert.That(
            tokens.Distinct().Count(),
            Is.EqualTo(tokens.Count),
            "All refresh tokens should be unique"
        );
    }

    [Test]
    [TestCase(1)]
    [TestCase(7)]
    [TestCase(30)]
    [TestCase(365)]
    public void CreateRefreshToken_DifferentValidityPeriods_ReturnsCorrectExpiry(int validForDays)
    {
        // Arrange
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _jwtService.CreateRefreshToken(validForDays);

        // Assert
        var expectedExpiry = beforeCreation.AddDays(validForDays);
        Assert.That(result.ExpiresAt, Is.EqualTo(expectedExpiry).Within(TimeSpan.FromSeconds(1)));
    }

    #endregion

    #region HashToken Tests

    [Test]
    public void HashToken_SameInput_ReturnsSameHash()
    {
        // Arrange
        var token = "test_token_123";

        // Act
        var hash1 = _jwtService.HashToken(token);
        var hash2 = _jwtService.HashToken(token);

        // Assert
        Assert.That(hash1, Is.EqualTo(hash2));
    }

    [Test]
    public void HashToken_DifferentInputs_ReturnDifferentHashes()
    {
        // Act
        var hash1 = _jwtService.HashToken("token1");
        var hash2 = _jwtService.HashToken("token2");
        var hash3 = _jwtService.HashToken("token1_different");

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(hash1, Is.Not.EqualTo(hash2));
            Assert.That(hash1, Is.Not.EqualTo(hash3));
            Assert.That(hash2, Is.Not.EqualTo(hash3));
        });
    }

    [Test]
    public void HashToken_ReturnsBase64String()
    {
        // Arrange
        var token = "test_token";

        // Act
        var hash = _jwtService.HashToken(token);

        // Assert
        Assert.That(hash, Is.Not.Null.And.Not.Empty);
        Assert.That(
            () => Convert.FromBase64String(hash),
            Throws.Nothing,
            "Hash should be a valid Base64 string"
        );
    }

    [Test]
    public void HashToken_EmptyString_ReturnsValidHash()
    {
        // Act
        var hash = _jwtService.HashToken(string.Empty);

        // Assert
        Assert.That(hash, Is.Not.Null.And.Not.Empty);
        Assert.That(() => Convert.FromBase64String(hash), Throws.Nothing);
    }

    #endregion

    #region ResendOtpAsync Tests

    [Test]
    public async Task ResendOtpAsync_ExistingUserWithUsername_UpdatesOtpAndSendsEmail()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithOtp("oldotp", DateTime.UtcNow.AddMinutes(2))
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);
        SetupSuccessfulEmailSending();

        // Act
        var result = await _jwtService.ResendOtpAsync("testuser");

        // Assert
        AssertSuccessResult(result);

        var updatedUser = await GetUserById(user.Id);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updatedUser.Otp, Is.Not.EqualTo("oldotp"));
            Assert.That(updatedUser.Otp, Has.Length.EqualTo(6));
            Assert.That(updatedUser.Otp, Does.Match(@"^\d{6}$"));
            Assert.That(updatedUser.OtpExpiresAt, Is.GreaterThan(DateTime.UtcNow.AddMinutes(4)));
            Assert.That(updatedUser.OtpExpiresAt, Is.LessThan(DateTime.UtcNow.AddMinutes(6)));
        });

        // Verify email was sent
        EmailServiceMock.Verify(
            x => x.SendOtpEmailAsync(user.Email, user.Username, It.IsAny<string>(), "5 minutes"),
            Times.Once
        );
    }

    [Test]
    public async Task ResendOtpAsync_ExistingUserWithEmail_UpdatesOtpAndSendsEmail()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);
        SetupSuccessfulEmailSending();

        // Act
        var result = await _jwtService.ResendOtpAsync("test@test.com");

        // Assert
        AssertSuccessResult(result);

        var updatedUser = await GetUserById(user.Id);
        Assert.That(updatedUser, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updatedUser.Otp, Is.Not.Null);
            Assert.That(updatedUser.OtpExpiresAt, Is.Not.Null);
        });
    }

    [Test]
    public async Task ResendOtpAsync_UserNotFound_ReturnsNotFound()
    {
        // Act
        var result = await _jwtService.ResendOtpAsync("nonexistent@test.com");

        // Assert
        AssertErrorResult(result, "User not found");
    }

    [Test]
    public async Task ResendOtpAsync_EmailSendingFails_RollsBackTransaction()
    {
        // Arrange
        var user = CreateUserBuilder()
            .WithUsername("testuser")
            .WithEmail("test@test.com")
            .WithOtp("oldotp", DateTime.UtcNow.AddMinutes(2))
            .AsCompleteRegistration()
            .Build();

        await AddUserToDatabase(user);
        SetupFailedEmailSending("Email service error");

        // Act
        var result = await _jwtService.ResendOtpAsync("testuser");

        // Assert
        AssertErrorResult(result, "Email service error");

        // Verify OTP was not updated (transaction rolled back)
        var unchangedUser = await GetUserById(user.Id);
        Assert.That(unchangedUser, Is.Not.Null);
        Assert.That(unchangedUser.Otp, Is.EqualTo("oldotp"));
    }

    #endregion
}
