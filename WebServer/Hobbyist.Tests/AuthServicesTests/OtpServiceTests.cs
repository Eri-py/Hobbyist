using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Common;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

/// <summary>
/// Unit tests for OtpService.
/// All dependencies (ICache, IEmailService) are mocked.
/// These tests verify OTP generation, caching, verification, and email sending logic.
/// </summary>
[TestFixture]
public class OtpServiceTests
{
    private Mock<ICache> _mockCache = null!;
    private Mock<IEmailService> _mockEmailService = null!;
    private OtpService _otpService = null!;

    private const string TestEmail = "test@example.com";
    private const string TestPurpose = "test_purpose";

    [SetUp]
    public void SetUp()
    {
        _mockCache = new Mock<ICache>();
        _mockEmailService = new Mock<IEmailService>();
        _otpService = new OtpService(_mockCache.Object, _mockEmailService.Object);
    }

    #region CreateOtp Tests

    [Test]
    public void CreateOtp_ReturnsSixDigitOtp()
    {
        // Act
        var result = _otpService.CreateOtp(5);

        // Assert
        Assert.That(result.Value, Has.Length.EqualTo(6));
        Assert.That(result.Value, Does.Match(@"^\d{6}$"), "OTP should be exactly 6 digits");
    }

    [Test]
    public void CreateOtp_SetsCorrectExpirationTime()
    {
        // Arrange
        var validForMinutes = 10;
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _otpService.CreateOtp(validForMinutes);

        // Assert
        var afterCreation = DateTime.UtcNow;
        var expectedMin = beforeCreation.AddMinutes(validForMinutes);
        var expectedMax = afterCreation.AddMinutes(validForMinutes);

        Assert.That(result.ExpiresAt, Is.GreaterThanOrEqualTo(expectedMin));
        Assert.That(result.ExpiresAt, Is.LessThanOrEqualTo(expectedMax));
    }

    [Test]
    public void CreateOtp_GeneratesDifferentOtpsOnSuccessiveCalls()
    {
        // Act
        var otp1 = _otpService.CreateOtp(5);
        var otp2 = _otpService.CreateOtp(5);
        var otp3 = _otpService.CreateOtp(5);

        // Assert
        // While theoretically they could be the same, the probability is extremely low (1 in 1,000,000)
        var otps = new[] { otp1.Value, otp2.Value, otp3.Value };
        Assert.That(
            otps.Distinct().Count(),
            Is.GreaterThan(1),
            "Multiple OTP generations should produce different values (probability of collision is extremely low)"
        );
    }

    [Test]
    public void CreateOtp_AllDigitsAreValid()
    {
        // Act
        var result = _otpService.CreateOtp(5);

        // Assert
        foreach (var digit in result.Value)
        {
            Assert.That(char.IsDigit(digit), Is.True, $"Character '{digit}' should be a digit");
        }
    }

    #endregion

    #region SendOtpAsync Tests

    [Test]
    public async Task SendOtpAsync_SendsEmailWithSixDigitOtp()
    {
        // Arrange
        SetupSuccessfulEmail();

        string? capturedOtp = null;
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())
            )
            .Callback<string, string, string>((email, otp, validFor) => capturedOtp = otp)
            .ReturnsAsync(Result.NoContent());

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose);

        // Assert
        Assert.That(capturedOtp, Is.Not.Null);
        Assert.That(capturedOtp, Has.Length.EqualTo(6));
        Assert.That(capturedOtp, Does.Match(@"^\d{6}$"));
    }

    [Test]
    public async Task SendOtpAsync_SendsEmailToCorrectAddress()
    {
        // Arrange
        SetupSuccessfulEmail();

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose);

        // Assert
        _mockEmailService.Verify(
            x => x.SendOtpEmailAsync(TestEmail, It.IsAny<string>(), It.IsAny<string>()),
            Times.Once
        );
    }

    [Test]
    public async Task SendOtpAsync_SendsEmailWithCorrectValidityDuration()
    {
        // Arrange
        SetupSuccessfulEmail();

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose);

        // Assert
        _mockEmailService.Verify(
            x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    $"{AuthConfig.OtpValidForMinutes} minutes"
                ),
            Times.Once
        );
    }

    [Test]
    public async Task SendOtpAsync_StoresOtpInCacheWithCorrectKey()
    {
        // Arrange
        SetupSuccessfulEmail();

        string? capturedKey = null;
        string? capturedValue = null;
        TimeSpan? capturedExpiration = null;

        _mockCache
            .Setup(x => x.Set(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()))
            .Callback<string, string, TimeSpan>(
                (key, value, exp) =>
                {
                    capturedKey = key;
                    capturedValue = value;
                    capturedExpiration = exp;
                }
            );

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose);

        // Assert
        var expectedKey = $"otp_{TestPurpose}_{TestEmail}";
        Assert.That(capturedKey, Is.EqualTo(expectedKey));
        Assert.That(capturedValue, Is.Not.Null);
        Assert.That(capturedValue, Has.Length.EqualTo(6));
    }

    [Test]
    public async Task SendOtpAsync_SetsCacheExpirationCorrectly()
    {
        // Arrange
        SetupSuccessfulEmail();

        TimeSpan? capturedExpiration = null;

        _mockCache
            .Setup(x => x.Set(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()))
            .Callback<string, string, TimeSpan>((key, value, exp) => capturedExpiration = exp);

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose);

        // Assert
        Assert.That(capturedExpiration, Is.Not.Null);
        Assert.That(
            capturedExpiration!.Value.TotalMinutes,
            Is.EqualTo(AuthConfig.OtpValidForMinutes).Within(0.1)
        );
    }

    [Test]
    public async Task SendOtpAsync_ReturnsSuccessWithExpirationTime()
    {
        // Arrange
        SetupSuccessfulEmail();

        var beforeSend = DateTime.UtcNow;

        // Act
        var result = await _otpService.SendOtpAsync(TestEmail, TestPurpose);

        // Assert
        var afterSend = DateTime.UtcNow;
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
        Assert.That(result.Content, Is.Not.Null);

        var expectedMin = beforeSend.AddMinutes(AuthConfig.OtpValidForMinutes);
        var expectedMax = afterSend.AddMinutes(AuthConfig.OtpValidForMinutes);
        Assert.That(result.Content!.OtpExpiresAt, Is.GreaterThanOrEqualTo(expectedMin));
        Assert.That(result.Content.OtpExpiresAt, Is.LessThanOrEqualTo(expectedMax));
    }

    [Test]
    public async Task SendOtpAsync_WhenEmailFails_ReturnsError()
    {
        // Arrange
        var emailError = Result.InternalServerError("Email service unavailable");
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())
            )
            .ReturnsAsync(emailError);

        // Act
        var result = await _otpService.SendOtpAsync(TestEmail, TestPurpose);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
        Assert.That(result.Message, Is.EqualTo("Email service unavailable"));
    }

    [Test]
    public async Task SendOtpAsync_WhenEmailFails_DoesNotCacheOtp()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())
            )
            .ReturnsAsync(Result.InternalServerError("Email failed"));

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose);

        // Assert
        _mockCache.Verify(
            x => x.Set(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()),
            Times.Never,
            "OTP should not be cached if email sending fails"
        );
    }

    #endregion

    #region VerifyOtp Tests

    [Test]
    public void VerifyOtp_WithValidOtp_ReturnsSuccess()
    {
        // Arrange
        var expectedOtp = "123456";
        SetupCachedOtp(expectedOtp);

        // Act
        var result = _otpService.VerifyOtp(TestEmail, expectedOtp, TestPurpose);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NoContent));
    }

    [Test]
    public void VerifyOtp_WithValidOtp_RemovesOtpFromCache()
    {
        // Arrange
        var expectedOtp = "123456";
        SetupCachedOtp(expectedOtp);

        // Act
        _otpService.VerifyOtp(TestEmail, expectedOtp, TestPurpose);

        // Assert
        _mockCache.Verify(
            x => x.Remove($"otp_{TestPurpose}_{TestEmail}"),
            Times.Once,
            "OTP should be removed from cache after successful verification"
        );
    }

    [Test]
    public void VerifyOtp_WithValidOtp_SetsVerifiedFlagInCache()
    {
        // Arrange
        var expectedOtp = "123456";
        SetupCachedOtp(expectedOtp);

        string? verifiedKey = null;
        bool? verifiedValue = null;
        TimeSpan? verifiedExpiration = null;

        _mockCache
            .Setup(x => x.Set(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<TimeSpan>()))
            .Callback<string, bool, TimeSpan>(
                (key, value, exp) =>
                {
                    verifiedKey = key;
                    verifiedValue = value;
                    verifiedExpiration = exp;
                }
            );

        // Act
        _otpService.VerifyOtp(TestEmail, expectedOtp, TestPurpose);

        // Assert
        Assert.That(verifiedKey, Is.EqualTo($"verified_{TestPurpose}_{TestEmail}"));
        Assert.That(verifiedValue, Is.EqualTo(true));
        Assert.That(verifiedExpiration, Is.EqualTo(TimeSpan.FromMinutes(15)));
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_ReturnsBadRequest()
    {
        // Arrange
        SetupCachedOtp("123456");

        // Act
        var result = _otpService.VerifyOtp(TestEmail, "wrong_otp", TestPurpose);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        Assert.That(result.Message, Is.EqualTo("Invalid or expired verification code"));
    }

    [Test]
    public void VerifyOtp_WithExpiredOtp_ReturnsBadRequest()
    {
        // Arrange
        SetupNoCachedOtp();

        // Act
        var result = _otpService.VerifyOtp(TestEmail, "123456", TestPurpose);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        Assert.That(result.Message, Is.EqualTo("Invalid or expired verification code"));
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_DoesNotSetVerifiedFlag()
    {
        // Arrange
        SetupCachedOtp("123456");

        // Act
        _otpService.VerifyOtp(TestEmail, "wrong_otp", TestPurpose);

        // Assert
        _mockCache.Verify(
            x => x.Set(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<TimeSpan>()),
            Times.Never,
            "Verified flag should not be set for invalid OTP"
        );
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_DoesNotRemoveOtpFromCache()
    {
        // Arrange
        SetupCachedOtp("123456");

        // Act
        _otpService.VerifyOtp(TestEmail, "wrong_otp", TestPurpose);

        // Assert
        _mockCache.Verify(
            x => x.Remove(It.IsAny<string>()),
            Times.Never,
            "OTP should remain in cache if verification fails"
        );
    }

    [Test]
    public void VerifyOtp_IsCaseSensitive()
    {
        // Arrange
        SetupCachedOtp("123456");

        // Act
        var result = _otpService.VerifyOtp(TestEmail, "123456", TestPurpose);

        // Assert
        Assert.That(result.IsSuccess, Is.True, "Exact match should succeed");
    }

    #endregion

    #region IsVerified Tests

    [Test]
    public void IsVerified_WhenVerificationExists_ReturnsTrue()
    {
        // Arrange
        SetupVerifiedFlag(true);

        // Act
        var result = _otpService.IsVerified(TestEmail, TestPurpose);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void IsVerified_WhenVerificationDoesNotExist_ReturnsFalse()
    {
        // Arrange
        SetupVerifiedFlag(false);

        // Act
        var result = _otpService.IsVerified(TestEmail, TestPurpose);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void IsVerified_ChecksCorrectCacheKey()
    {
        // Arrange
        bool? outValue = true;
        SetupVerifiedFlag(true);

        // Act
        _otpService.IsVerified(TestEmail, TestPurpose);

        // Assert
        _mockCache.Verify(
            x => x.TryGetValue($"verified_{TestPurpose}_{TestEmail}", out outValue),
            Times.Once
        );
    }

    #endregion

    #region ClearVerification Tests

    [Test]
    public void ClearVerification_RemovesVerificationFromCache()
    {
        // Act
        _otpService.ClearVerification(TestEmail, TestPurpose);

        // Assert
        _mockCache.Verify(x => x.Remove($"verified_{TestPurpose}_{TestEmail}"), Times.Once);
    }

    [Test]
    public void ClearVerification_UsesCorrectCacheKey()
    {
        // Arrange
        var customEmail = "custom@example.com";
        var customPurpose = "custom_purpose";

        // Act
        _otpService.ClearVerification(customEmail, customPurpose);

        // Assert
        _mockCache.Verify(x => x.Remove($"verified_{customPurpose}_{customEmail}"), Times.Once);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Sets up the email service to return success
    /// </summary>
    private void SetupSuccessfulEmail()
    {
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())
            )
            .ReturnsAsync(Result.NoContent());
    }

    /// <summary>
    /// Sets up the cache to return a specific OTP value
    /// </summary>
    private void SetupCachedOtp(string otpValue)
    {
        string? outValue = otpValue;
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{TestEmail}", out outValue))
            .Returns(true);
    }

    /// <summary>
    /// Sets up the cache to return no OTP (simulates expired OTP)
    /// </summary>
    private void SetupNoCachedOtp()
    {
        string? outValue = null;
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{TestEmail}", out outValue))
            .Returns(false);
    }

    /// <summary>
    /// Sets up the cache to return a verified flag
    /// </summary>
    private void SetupVerifiedFlag(bool exists)
    {
        bool? outValue = true;
        _mockCache
            .Setup(x => x.TryGetValue($"verified_{TestPurpose}_{TestEmail}", out outValue))
            .Returns(exists);
    }

    #endregion
}
