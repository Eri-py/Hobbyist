using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Common;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace Hobbyist.Tests;

[TestFixture]
public class OtpServiceTests
{
    private Mock<IMemoryCache> _cacheMock;
    private Mock<IEmailService> _emailServiceMock;
    private OtpService _otpService;

    [SetUp]
    public void SetUp()
    {
        _cacheMock = new Mock<IMemoryCache>();
        _emailServiceMock = new Mock<IEmailService>();
        _otpService = new OtpService(_cacheMock.Object, _emailServiceMock.Object);
    }

    [Test]
    public void CreateOtp_ShouldCreateOtpWithSixDigits()
    {
        // Arrange
        var otpValidForMinutes = 5;

        // Act
        var result = _otpService.CreateOtp(otpValidForMinutes);

        // Assert
        Assert.That(result.Value, Has.Length.EqualTo(6));
        Assert.That(result.Value, Does.Match(@"^\d{6}$"));
    }

    [Test]
    public void CreateOtp_ShouldSetCorrectExpirationTime()
    {
        // Arrange
        var otpValidForMinutes = 5;
        var beforeCreation = DateTime.UtcNow;

        // Act
        var result = _otpService.CreateOtp(otpValidForMinutes);

        // Assert
        var expectedExpiry = beforeCreation.AddMinutes(otpValidForMinutes);
        Assert.That(
            result.ExpiresAt,
            Is.EqualTo(expectedExpiry).Within(TimeSpan.FromMilliseconds(5))
        );
    }

    [Test]
    public void CreateOtp_ShouldCreateDifferentOtpsOnMultipleCalls()
    {
        // Arrange
        var otpValidForMinutes = 5;
        var otps = new HashSet<string>();

        // Act
        for (int i = 0; i < 10; i++)
        {
            var result = _otpService.CreateOtp(otpValidForMinutes);
            otps.Add(result.Value);
        }

        // Assert - At least some should be different (very unlikely all 10 are the same)
        Assert.That(otps, Has.Count.EqualTo(10));
    }

    [Test]
    public async Task SendOtpAsync_ShouldSendEmailAndCacheOtp_WhenEmailSendsSuccessfully()
    {
        // Arrange
        var email = "test@example.com";
        var purpose = "signup";
        var cacheKey = $"otp_{purpose}_{email}";

        _emailServiceMock
            .Setup(x =>
                x.SendOtpEmailAsync(
                    email,
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    $"{AuthConfig.OtpValidForMinutes} minutes"
                )
            )
            .ReturnsAsync(Result.NoContent());

        var mockCacheEntry = new Mock<ICacheEntry>();
        object? capturedValue = null;

        mockCacheEntry
            .SetupSet(x => x.Value = It.IsAny<object>())
            .Callback<object>(value => capturedValue = value);

        mockCacheEntry.SetupSet(x => x.AbsoluteExpirationRelativeToNow = It.IsAny<TimeSpan?>());

        _cacheMock.Setup(x => x.CreateEntry(cacheKey)).Returns(mockCacheEntry.Object);

        // Act
        var result = await _otpService.SendOtpAsync(email, It.IsAny<string>(), purpose);

        Assert.Multiple(() =>
        {
            // Assert
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content, Is.Not.Null);
        });
        Assert.That(result.Content!.OtpExpiresAt, Is.Not.EqualTo(default(DateTime)));

        _emailServiceMock.Verify(
            x =>
                x.SendOtpEmailAsync(
                    email,
                    It.IsAny<string>(),
                    It.Is<string>(otp => otp.Length == 6),
                    $"{AuthConfig.OtpValidForMinutes} minutes"
                ),
            Times.Once
        );

        _cacheMock.Verify(x => x.CreateEntry(cacheKey), Times.Once);

        mockCacheEntry.VerifySet(x =>
            x.AbsoluteExpirationRelativeToNow = It.Is<TimeSpan?>(ts =>
                ts.HasValue && ts.Value.TotalMinutes == AuthConfig.OtpValidForMinutes
            )
        );

        Assert.That(capturedValue, Is.Not.Null);
        Assert.That(capturedValue!.ToString(), Has.Length.EqualTo(6));
    }

    [Test]
    public async Task SendOtpAsync_ShouldReturnFailure_WhenEmailSendingFails()
    {
        // Arrange
        var email = "test@example.com";
        var purpose = "signup";
        var errorMessage = "An unexpected error has occured";

        _emailServiceMock
            .Setup(x =>
                x.SendOtpEmailAsync(
                    email,
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()
                )
            )
            .ReturnsAsync(Result.InternalServerError(errorMessage));

        // Act
        var result = await _otpService.SendOtpAsync(email, It.IsAny<string>(), purpose);

        using (Assert.EnterMultipleScope())
        {
            // Assert
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.InternalServerError));
        }

        _cacheMock.Verify(x => x.CreateEntry(It.IsAny<object>()), Times.Never);
    }

    [Test]
    public async Task SendOtpAsync_ShouldGenerateDifferentOtpForSameEmail()
    {
        // Arrange
        var email = "test@example.com";
        var purpose = "signup";
        var capturedOtps = new List<string>();

        _emailServiceMock
            .Setup(x =>
                x.SendOtpEmailAsync(
                    email,
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()
                )
            )
            .Callback<string, string, string, string>((_, _, otp, _) => capturedOtps.Add(otp))
            .ReturnsAsync(Result.NoContent());

        var mockCacheEntry = new Mock<ICacheEntry>();
        _cacheMock.Setup(x => x.CreateEntry(It.IsAny<object>())).Returns(mockCacheEntry.Object);

        // Act
        await _otpService.SendOtpAsync(email, It.IsAny<string>(), purpose);

        // Assert - OTPs should be different (very high probability)
        Assert.That(capturedOtps, Has.Count.EqualTo(2));
    }

    [Test]
    public void VerifyOtp_ShouldReturnSuccess_WhenOtpIsValid()
    {
        // Arrange
        var email = "test@example.com";
        var otp = "123456";
        var purpose = "signup";
        var cacheKey = $"otp_{purpose}_{email}";

        object? cachedValue = otp;
        _cacheMock.Setup(x => x.TryGetValue(cacheKey, out cachedValue)).Returns(true);

        // Act
        var result = _otpService.VerifyOtp(email, otp, purpose);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NoContent));
        _cacheMock.Verify(x => x.Remove(cacheKey), Times.Once);
    }

    [Test]
    public void VerifyOtp_ShouldReturnFailure_WhenOtpDoesNotExistInCache()
    {
        // Arrange
        var email = "test@example.com";
        var otp = "123456";
        var purpose = "signup";
        var cacheKey = $"otp_{purpose}_{email}";

        object? cachedValue = null;
        _cacheMock.Setup(x => x.TryGetValue(cacheKey, out cachedValue)).Returns(false);

        // Act
        var result = _otpService.VerifyOtp(email, otp, purpose);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        Assert.That(result.Message, Is.EqualTo("Invalid or expired verification code"));
        _cacheMock.Verify(x => x.Remove(It.IsAny<object>()), Times.Never);
    }

    [Test]
    public void VerifyOtp_ShouldReturnFailure_WhenOtpDoesNotMatch()
    {
        // Arrange
        var email = "test@example.com";
        var otp = "123456";
        var wrongOtp = "654321";
        var purpose = "signup";
        var cacheKey = $"otp_{purpose}_{email}";

        object? cachedValue = otp;
        _cacheMock.Setup(x => x.TryGetValue(cacheKey, out cachedValue)).Returns(true);

        // Act
        var result = _otpService.VerifyOtp(email, wrongOtp, purpose);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        Assert.That(result.Message, Is.EqualTo("Invalid or expired verification code"));
        _cacheMock.Verify(x => x.Remove(It.IsAny<object>()), Times.Never);
    }

    [Test]
    public void VerifyOtp_ShouldRemoveOtpFromCache_AfterSuccessfulVerification()
    {
        // Arrange
        var email = "test@example.com";
        var otp = "123456";
        var purpose = "signup";
        var cacheKey = $"otp_{purpose}_{email}";

        object? cachedValue = otp;
        _cacheMock.Setup(x => x.TryGetValue(cacheKey, out cachedValue)).Returns(true);

        // Act
        _otpService.VerifyOtp(email, otp, purpose);

        // Assert
        _cacheMock.Verify(x => x.Remove(cacheKey), Times.Once);
    }

    [Test]
    public void VerifyOtp_ShouldHandleDifferentPurposes()
    {
        // Arrange
        var email = "test@example.com";
        var otp = "123456";
        var purpose1 = "signup";
        var purpose2 = "password-reset";
        var cacheKey1 = $"otp_{purpose1}_{email}";
        var cacheKey2 = $"otp_{purpose2}_{email}";

        object? cachedValue1 = otp;
        object? cachedValue2 = null;

        _cacheMock.Setup(x => x.TryGetValue(cacheKey1, out cachedValue1)).Returns(true);

        _cacheMock.Setup(x => x.TryGetValue(cacheKey2, out cachedValue2)).Returns(false);

        // Act
        var result1 = _otpService.VerifyOtp(email, otp, purpose1);
        var result2 = _otpService.VerifyOtp(email, otp, purpose2);

        // Assert
        Assert.That(result1.IsSuccess, Is.True);
        Assert.That(result2.IsSuccess, Is.False);
    }

    [Test]
    public void VerifyOtp_ShouldHandleNullCachedValue()
    {
        // Arrange
        var email = "test@example.com";
        var otp = "123456";
        var purpose = "signup";
        var cacheKey = $"otp_{purpose}_{email}";

        object? cachedValue = null;
        _cacheMock.Setup(x => x.TryGetValue(cacheKey, out cachedValue)).Returns(true); // Returns true but value is null

        // Act
        var result = _otpService.VerifyOtp(email, otp, purpose);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        _cacheMock.Verify(x => x.Remove(It.IsAny<object>()), Times.Never);
    }
}
