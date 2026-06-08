using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.CacheRateLimiterServices;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Api.Services.LoggingHashServices;
using Hobbyist.Common;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

/// <summary>
/// Unit tests for OtpService.
/// All dependencies (ICacheService, IEmailService) are mocked.
/// These tests verify OTP generation, caching, verification, and email sending logic.
/// </summary>
[TestFixture]
public class OtpServiceTests
{
    private Mock<ICacheService> _mockCache = null!;
    private Mock<IEmailService> _mockEmailService = null!;
    private Mock<ICacheRateLimiterService> _mockRateLimiter = null!;
    private Mock<ILogHasherService> _logHasherMock = null!;
    private OtpService _otpService = null!;

    private const string TestEmail = "test@example.com";
    private const string TestPurpose = "test_purpose";

    private static string HashEmail(string email) => $"hashed_{email}";

    [SetUp]
    public void SetUp()
    {
        _mockCache = new Mock<ICacheService>();
        _mockEmailService = new Mock<IEmailService>();
        _mockRateLimiter = new Mock<ICacheRateLimiterService>();
        _logHasherMock = new Mock<ILogHasherService>();
        _logHasherMock
            .Setup(x => x.Hash(It.IsAny<string?>()))
            .Returns((string? value) => $"hashed_{value}");
        LoggerExtensions.ConfigureHasher(_logHasherMock.Object);

        _mockRateLimiter
            .Setup(x =>
                x.CheckLimit(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<int>(),
                    It.IsAny<string>()
                )
            )
            .Returns(Result.NoContent());

        _otpService = new OtpService(
            _mockCache.Object,
            _mockEmailService.Object,
            _mockRateLimiter.Object,
            NullLogger<OtpService>.Instance
        );
    }

    #region CreateOtp Tests

    [Test]
    public void CreateOtp_ReturnsSixDigitOtp()
    {
        // Act
        var result = _otpService.CreateOtp(OtpConfig.OtpLifetimeMinutes);

        // Assert
        Assert.That(result.Value, Has.Length.EqualTo(6));
        Assert.That(
            result.Value,
            Does.Match(@"^[0-9]{6}$"),
            "OTP should be exactly 6 numeric digits"
        );
    }

    [Test]
    public void CreateOtp_SetsCorrectExpirationTime()
    {
        var result = _otpService.CreateOtp(OtpConfig.OtpLifetimeMinutes);

        // Assert
        Assert.That(
            result.ExpiresAt,
            Is.EqualTo(DateTimeOffset.UtcNow.AddMinutes(OtpConfig.OtpLifetimeMinutes))
                .Within(TimeSpan.FromSeconds(5))
        );
    }

    [Test]
    public void CreateOtp_GeneratesDifferentOtpsOnSuccessiveCalls()
    {
        // Act
        var otp1 = _otpService.CreateOtp(OtpConfig.OtpLifetimeMinutes);
        var otp2 = _otpService.CreateOtp(OtpConfig.OtpLifetimeMinutes);
        var otp3 = _otpService.CreateOtp(OtpConfig.OtpLifetimeMinutes);

        // Assert
        var otps = new[] { otp1.Value, otp2.Value, otp3.Value };
        Assert.That(otps.Distinct().Count(), Is.EqualTo(3));
    }

    [Test]
    public void CreateOtp_AllCharactersAreDigits()
    {
        // Act
        var result = _otpService.CreateOtp(OtpConfig.OtpLifetimeMinutes);

        // Assert
        foreach (var ch in result.Value)
        {
            Assert.That(char.IsDigit(ch), Is.True, $"Character '{ch}' should be a digit");
        }
    }

    #endregion

    #region SendOtpAsync Tests

    [Test]
    public async Task SendOtpAsync_GeneratesSixDigitOtp()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.NoContent());

        string? capturedOtp = null;
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .Callback<string, string, string, CancellationToken>(
                (email, otp, validFor, _) => capturedOtp = otp
            )
            .ReturnsAsync(Result.NoContent());

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        Assert.That(capturedOtp, Is.Not.Null);
        Assert.That(capturedOtp, Has.Length.EqualTo(6));
    }

    [Test]
    public async Task SendOtpAsync_GeneratesNumericOtp()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.NoContent());

        string? capturedOtp = null;
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .Callback<string, string, string, CancellationToken>(
                (email, otp, validFor, _) => capturedOtp = otp
            )
            .ReturnsAsync(Result.NoContent());

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        Assert.That(capturedOtp, Is.Not.Null);
        Assert.That(capturedOtp, Does.Match(@"^[0-9]{6}$"));
    }

    [Test]
    public async Task SendOtpAsync_SendsEmailToCorrectAddress()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.NoContent());

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        _mockEmailService.Verify(
            x =>
                x.SendOtpEmailAsync(
                    TestEmail,
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    [Test]
    public async Task SendOtpAsync_SendsEmailWithCorrectValidityDuration()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.NoContent());

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        _mockEmailService.Verify(
            x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    $"{OtpConfig.OtpLifetimeMinutes} minutes",
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    [Test]
    public async Task SendOtpAsync_StoresOtpInCacheWithCorrectKey()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.NoContent());

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
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        var expectedKey = $"otp_{TestPurpose}_{HashEmail(TestEmail)}";
        using (Assert.EnterMultipleScope())
        {
            Assert.That(capturedKey, Is.EqualTo(expectedKey));
            Assert.That(capturedValue, Is.Not.Null);
        }
        Assert.That(capturedValue, Has.Length.EqualTo(6));
    }

    [Test]
    public async Task SendOtpAsync_SetsCacheExpirationCorrectly()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.NoContent());

        TimeSpan? capturedExpiration = null;

        _mockCache
            .Setup(x => x.Set(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()))
            .Callback<string, string, TimeSpan>((key, value, exp) => capturedExpiration = exp);

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        Assert.That(capturedExpiration, Is.Not.Null);
        Assert.That(
            capturedExpiration!.Value.TotalMinutes,
            Is.EqualTo(OtpConfig.OtpLifetimeMinutes).Within(0.1)
        );
    }

    [Test]
    public async Task SendOtpAsync_ReturnsSuccessWithExpirationTime()
    {
        // Arrange
        var expected = DateTimeOffset.UtcNow.AddMinutes(OtpConfig.OtpLifetimeMinutes);
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.NoContent());

        // Act
        var result = await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Success));
            Assert.That(result.Content, Is.Not.Null);
        }
        var delta = (result.Content!.OtpExpiresAt - expected).Duration();
        Assert.That(delta, Is.LessThanOrEqualTo(TimeSpan.FromSeconds(5)));
    }

    [Test]
    public async Task SendOtpAsync_WhenEmailFails_ReturnsError()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.InternalServerError(ErrorMessages.UnexpectedError));

        // Act
        var result = await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.UnexpectedError));
        }
    }

    [Test]
    public async Task SendOtpAsync_WhenEmailFails_DoesNotCacheOtp()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.InternalServerError(ErrorMessages.UnexpectedError));

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        _mockCache.Verify(
            x => x.Set(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()),
            Times.Never
        );
    }

    [Test]
    public async Task SendOtpAsync_WhenRateLimitExceeded_ReturnsTooManyRequests()
    {
        // Arrange
        _mockRateLimiter
            .Setup(x =>
                x.CheckLimit(
                    $"otp_send_{TestPurpose}",
                    HashEmail(TestEmail),
                    OtpConfig.OtpMaxSendRequestsPerWindow,
                    ErrorMessages.TooManyOtpRequests
                )
            )
            .Returns(Result.TooManyRequests(ErrorMessages.TooManyOtpRequests));

        // Act
        var result = await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.TooManyRequests));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.TooManyOtpRequests));
        }
    }

    [Test]
    public async Task SendOtpAsync_WhenRateLimitExceeded_DoesNotSendEmail()
    {
        // Arrange
        _mockRateLimiter
            .Setup(x =>
                x.CheckLimit(
                    $"otp_send_{TestPurpose}",
                    HashEmail(TestEmail),
                    OtpConfig.OtpMaxSendRequestsPerWindow,
                    ErrorMessages.TooManyOtpRequests
                )
            )
            .Returns(Result.TooManyRequests(ErrorMessages.TooManyOtpRequests));

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        _mockEmailService.Verify(
            x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                ),
            Times.Never
        );
    }

    [Test]
    public async Task SendOtpAsync_WhenVerificationRateLimitExceeded_ReturnsTooManyRequests()
    {
        // Arrange
        _mockRateLimiter
            .Setup(x =>
                x.CheckLimit(
                    $"otp_verify_{TestPurpose}",
                    HashEmail(TestEmail),
                    OtpConfig.OtpMaxFailedVerificationAttempts,
                    ErrorMessages.TooManyOtpVerificationAttempts
                )
            )
            .Returns(Result.TooManyRequests(ErrorMessages.TooManyOtpVerificationAttempts));

        // Act
        var result = await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.TooManyRequests));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.TooManyOtpVerificationAttempts));
        }
    }

    [Test]
    public async Task SendOtpAsync_WhenVerificationRateLimitExceeded_DoesNotSendEmailOrIncrement()
    {
        // Arrange
        _mockRateLimiter
            .Setup(x =>
                x.CheckLimit(
                    $"otp_verify_{TestPurpose}",
                    HashEmail(TestEmail),
                    OtpConfig.OtpMaxFailedVerificationAttempts,
                    ErrorMessages.TooManyOtpVerificationAttempts
                )
            )
            .Returns(Result.TooManyRequests(ErrorMessages.TooManyOtpVerificationAttempts));

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        // Assert
        _mockEmailService.Verify(
            x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                ),
            Times.Never
        );

        _mockRateLimiter.Verify(
            x =>
                x.Increment(
                    $"otp_send_{TestPurpose}",
                    HashEmail(TestEmail),
                    TimeSpan.FromMinutes(OtpConfig.OtpSendRateLimitWindowMinutes)
                ),
            Times.Never
        );
    }

    [Test]
    public async Task SendOtpAsync_WhenEmailFails_DoesNotIncrementRateLimit()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.InternalServerError(ErrorMessages.UnexpectedError));

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        _mockRateLimiter.Verify(
            x => x.Increment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()),
            Times.Never
        );
    }

    [Test]
    public async Task SendOtpAsync_WhenEmailSucceeds_IncrementsRateLimit()
    {
        // Arrange
        _mockEmailService
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(Result.NoContent());

        // Act
        await _otpService.SendOtpAsync(TestEmail, TestPurpose, CancellationToken.None);

        _mockRateLimiter.Verify(
            x =>
                x.Increment(
                    $"otp_send_{TestPurpose}",
                    HashEmail(TestEmail),
                    TimeSpan.FromMinutes(OtpConfig.OtpSendRateLimitWindowMinutes)
                ),
            Times.Once
        );
    }

    #endregion

    #region VerifyOtp Tests

    [Test]
    public void VerifyOtp_WithValidOtp_ReturnsSuccess()
    {
        // Arrange
        var expectedOtp = "AB12CD";
        string? outValue = expectedOtp;
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

        // Act
        var result = _otpService.VerifyOtp(TestEmail, expectedOtp, TestPurpose);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NoContent));
        }
    }

    [Test]
    public void VerifyOtp_WhenVerificationRateLimitExceeded_ReturnsTooManyRequests()
    {
        // Arrange
        _mockRateLimiter
            .Setup(x =>
                x.CheckLimit(
                    $"otp_verify_{TestPurpose}",
                    HashEmail(TestEmail),
                    OtpConfig.OtpMaxFailedVerificationAttempts,
                    ErrorMessages.TooManyOtpVerificationAttempts
                )
            )
            .Returns(Result.TooManyRequests(ErrorMessages.TooManyOtpVerificationAttempts));

        // Act
        var result = _otpService.VerifyOtp(TestEmail, "AB12CD", TestPurpose);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.TooManyRequests));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.TooManyOtpVerificationAttempts));
        }
        _mockCache.Verify(x => x.Remove($"otp_{TestPurpose}_{HashEmail(TestEmail)}"), Times.Once);
        _mockRateLimiter.Verify(
            x => x.Increment(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<TimeSpan>()),
            Times.Never
        );
    }

    [Test]
    public void VerifyOtp_WithValidOtp_RemovesOtpFromCache()
    {
        // Arrange
        var expectedOtp = "AB12CD";
        string? outValue = expectedOtp;
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

        // Act
        _otpService.VerifyOtp(TestEmail, expectedOtp, TestPurpose);

        // Assert
        _mockCache.Verify(x => x.Remove($"otp_{TestPurpose}_{HashEmail(TestEmail)}"), Times.Once);
    }

    [Test]
    public void VerifyOtp_WithValidOtp_SetsVerifiedFlagInCache()
    {
        // Arrange
        var expectedOtp = "AB12CD";
        string? outValue = expectedOtp;
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

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
        using (Assert.EnterMultipleScope())
        {
            Assert.That(verifiedKey, Is.EqualTo($"verified_{TestPurpose}_{HashEmail(TestEmail)}"));
            Assert.That(verifiedValue, Is.True);
            Assert.That(verifiedExpiration, Is.EqualTo(TimeSpan.FromMinutes(15)));
        }
    }

    [Test]
    public void VerifyOtp_WithValidOtp_ResetsVerificationAttemptRateLimit()
    {
        // Arrange
        var expectedOtp = "AB12CD";
        string? outValue = expectedOtp;
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

        // Act
        _otpService.VerifyOtp(TestEmail, expectedOtp, TestPurpose);

        // Assert
        _mockRateLimiter.Verify(
            x => x.Reset($"otp_verify_{TestPurpose}", HashEmail(TestEmail)),
            Times.Once
        );
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_ReturnsBadRequest()
    {
        // Arrange
        string? outValue = "AB12CD";
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

        // Act
        var result = _otpService.VerifyOtp(TestEmail, "wrong_otp", TestPurpose);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidOrExpiredOtp));
        }
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_IncrementsVerificationAttemptRateLimit()
    {
        // Arrange
        string? outValue = "AB12CD";
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

        // Act
        _otpService.VerifyOtp(TestEmail, "wrong_otp", TestPurpose);

        // Assert
        _mockRateLimiter.Verify(
            x =>
                x.Increment(
                    $"otp_verify_{TestPurpose}",
                    HashEmail(TestEmail),
                    TimeSpan.FromMinutes(OtpConfig.OtpVerifyRateLimitWindowMinutes)
                ),
            Times.Once
        );
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_WhenAtMaxAttemptsStillReturnsBadRequestForThatAttempt()
    {
        // Arrange
        string? outValue = "AB12CD";
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

        // Act
        var result = _otpService.VerifyOtp(TestEmail, "wrong_otp", TestPurpose);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidOrExpiredOtp));
        }
        _mockCache.Verify(x => x.Remove(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public void VerifyOtp_WithExpiredOtp_ReturnsBadRequest()
    {
        // Arrange
        string? outValue = null;
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(false);

        // Act
        var result = _otpService.VerifyOtp(TestEmail, "AB12CD", TestPurpose);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidOrExpiredOtp));
        }
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_DoesNotSetVerifiedFlag()
    {
        // Arrange
        string? outValue = "AB12CD";
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

        // Act
        _otpService.VerifyOtp(TestEmail, "wrong_otp", TestPurpose);

        // Assert
        _mockCache.Verify(
            x => x.Set(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<TimeSpan>()),
            Times.Never
        );
    }

    [Test]
    public void VerifyOtp_WithInvalidOtp_DoesNotRemoveOtpFromCache()
    {
        // Arrange
        string? outValue = "AB12CD";
        _mockCache
            .Setup(x => x.TryGetValue($"otp_{TestPurpose}_{HashEmail(TestEmail)}", out outValue))
            .Returns(true);

        // Act
        _otpService.VerifyOtp(TestEmail, "wrong_otp", TestPurpose);

        // Assert
        _mockCache.Verify(x => x.Remove(It.IsAny<string>()), Times.Never);
    }

    #endregion

    #region IsVerified Tests

    [Test]
    public void IsVerified_WhenVerificationExists_ReturnsTrue()
    {
        // Arrange
        bool? outValue = true;
        _mockCache
            .Setup(x =>
                x.TryGetValue($"verified_{TestPurpose}_{HashEmail(TestEmail)}", out outValue)
            )
            .Returns(true);

        // Act
        var result = _otpService.IsVerified(TestEmail, TestPurpose);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void IsVerified_WhenVerificationDoesNotExist_ReturnsFalse()
    {
        // Arrange
        bool? outValue = false;
        _mockCache
            .Setup(x =>
                x.TryGetValue($"verified_{TestPurpose}_{HashEmail(TestEmail)}", out outValue)
            )
            .Returns(false);

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
        _mockCache
            .Setup(x =>
                x.TryGetValue($"verified_{TestPurpose}_{HashEmail(TestEmail)}", out outValue)
            )
            .Returns(true);

        // Act
        _otpService.IsVerified(TestEmail, TestPurpose);

        // Assert
        _mockCache.Verify(
            x => x.TryGetValue($"verified_{TestPurpose}_{HashEmail(TestEmail)}", out outValue),
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
        _mockCache.Verify(
            x => x.Remove($"verified_{TestPurpose}_{HashEmail(TestEmail)}"),
            Times.Once
        );
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
        _mockCache.Verify(
            x => x.Remove($"verified_{customPurpose}_{HashEmail(customEmail)}"),
            Times.Once
        );
    }

    #endregion
}
