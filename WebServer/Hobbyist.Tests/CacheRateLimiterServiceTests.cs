using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.CacheRateLimiterServices;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.LoggingHashServices;
using Hobbyist.Common;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests;

[TestFixture]
public class CacheRateLimiterServiceTests
{
    private Mock<ICacheService> _mockCache = null!;
    private Mock<ILogHasherService> _logHasherMock = null!;
    private CacheRateLimiterService _rateLimiter = null!;

    [SetUp]
    public void SetUp()
    {
        _mockCache = new Mock<ICacheService>();
        _logHasherMock = new Mock<ILogHasherService>();
        _logHasherMock
            .Setup(x => x.Hash(It.IsAny<string?>()))
            .Returns((string? value) => $"hashed_{value}");
        LoggerExtensions.ConfigureHasher(_logHasherMock.Object);

        _rateLimiter = new CacheRateLimiterService(
            _mockCache.Object,
            NullLogger<CacheRateLimiterService>.Instance
        );
    }

    [Test]
    public void CheckLimit_WhenNoEntryExists_ReturnsNoContent()
    {
        // Arrange
        RateLimitEntry? entry = null;
        _mockCache
            .Setup(x =>
                x.TryGetValue("ratelimit_otp_send_signup_hashed_test@example.com", out entry)
            )
            .Returns(false);

        // Act
        var result = _rateLimiter.CheckLimit(
            "otp_send_signup",
            "hashed_test@example.com",
            5,
            ErrorMessages.TooManyOtpRequests
        );

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NoContent));
        }
    }

    [Test]
    public void CheckLimit_WhenEntryBelowMax_ReturnsNoContent()
    {
        // Arrange
        RateLimitEntry? entry = new(4, DateTimeOffset.UtcNow.AddMinutes(5));
        _mockCache
            .Setup(x =>
                x.TryGetValue("ratelimit_otp_send_signup_hashed_test@example.com", out entry)
            )
            .Returns(true);

        // Act
        var result = _rateLimiter.CheckLimit(
            "otp_send_signup",
            "hashed_test@example.com",
            5,
            ErrorMessages.TooManyOtpRequests
        );

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NoContent));
        }
    }

    [Test]
    public void CheckLimit_WhenEntryAtMax_ReturnsTooManyRequests()
    {
        // Arrange
        RateLimitEntry? entry = new(5, DateTimeOffset.UtcNow.AddMinutes(5));
        _mockCache
            .Setup(x =>
                x.TryGetValue("ratelimit_otp_send_signup_hashed_test@example.com", out entry)
            )
            .Returns(true);

        // Act
        var result = _rateLimiter.CheckLimit(
            "otp_send_signup",
            "hashed_test@example.com",
            5,
            ErrorMessages.TooManyOtpRequests
        );

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.TooManyRequests));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.TooManyOtpRequests));
        }
    }

    [Test]
    public void Increment_WhenNoEntryExists_SetsCountToOneWithWindowTtl()
    {
        // Arrange
        RateLimitEntry? entry = null;
        _mockCache
            .Setup(x =>
                x.TryGetValue("ratelimit_otp_send_signup_hashed_test@example.com", out entry)
            )
            .Returns(false);

        string? capturedKey = null;
        RateLimitEntry? capturedEntry = null;
        TimeSpan? capturedTtl = null;

        _mockCache
            .Setup(x => x.Set(It.IsAny<string>(), It.IsAny<RateLimitEntry>(), It.IsAny<TimeSpan>()))
            .Callback<string, RateLimitEntry, TimeSpan>(
                (key, value, expiration) =>
                {
                    capturedKey = key;
                    capturedEntry = value;
                    capturedTtl = expiration;
                }
            );

        var window = TimeSpan.FromMinutes(5);

        // Act
        _rateLimiter.Increment("otp_send_signup", "hashed_test@example.com", window);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(
                capturedKey,
                Is.EqualTo("ratelimit_otp_send_signup_hashed_test@example.com")
            );
            Assert.That(capturedEntry, Is.Not.Null);
            Assert.That(capturedEntry!.Count, Is.EqualTo(1));
            Assert.That(capturedTtl, Is.Not.Null);
            Assert.That(
                capturedTtl!.Value.TotalMinutes,
                Is.EqualTo(window.TotalMinutes).Within(0.2)
            );
        }
    }

    [Test]
    public void Increment_WhenEntryExists_IncrementsCountAndKeepsWindowExpiry()
    {
        // Arrange
        var existingExpiry = DateTimeOffset.UtcNow.AddMinutes(3);
        RateLimitEntry? entry = new(2, existingExpiry);
        _mockCache
            .Setup(x =>
                x.TryGetValue("ratelimit_otp_send_signup_hashed_test@example.com", out entry)
            )
            .Returns(true);

        RateLimitEntry? capturedEntry = null;
        _mockCache
            .Setup(x => x.Set(It.IsAny<string>(), It.IsAny<RateLimitEntry>(), It.IsAny<TimeSpan>()))
            .Callback<string, RateLimitEntry, TimeSpan>((_, value, _) => capturedEntry = value);

        // Act
        _rateLimiter.Increment(
            "otp_send_signup",
            "hashed_test@example.com",
            TimeSpan.FromMinutes(5)
        );

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(capturedEntry, Is.Not.Null);
            Assert.That(capturedEntry!.Count, Is.EqualTo(3));
            Assert.That(capturedEntry.WindowExpiry, Is.EqualTo(existingExpiry));
        }
    }

    [Test]
    public void Reset_RemovesRateLimitKey()
    {
        // Act
        _rateLimiter.Reset("otp_send_signup", "hashed_test@example.com");

        // Assert
        _mockCache.Verify(
            x => x.Remove("ratelimit_otp_send_signup_hashed_test@example.com"),
            Times.Once
        );
    }

    [Test]
    public void CheckLimit_WithEmptyScope_ThrowsArgumentException()
    {
        // Act + Assert
        Assert.Throws<ArgumentException>(() =>
            _rateLimiter.CheckLimit(
                "",
                "hashed_test@example.com",
                5,
                ErrorMessages.TooManyOtpRequests
            )
        );
    }

    [Test]
    public void CheckLimit_WithEmptyIdentifier_ThrowsArgumentException()
    {
        // Act + Assert
        Assert.Throws<ArgumentException>(() =>
            _rateLimiter.CheckLimit("otp_send_signup", "", 5, ErrorMessages.TooManyOtpRequests)
        );
    }

    [Test]
    public void CheckLimit_WithNonPositiveMaxRequests_ThrowsArgumentOutOfRangeException()
    {
        // Act + Assert
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            _rateLimiter.CheckLimit(
                "otp_send_signup",
                "hashed_test@example.com",
                0,
                ErrorMessages.TooManyOtpRequests
            )
        );
    }

    [Test]
    public void Increment_WithNonPositiveWindow_ThrowsArgumentOutOfRangeException()
    {
        // Act + Assert
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            _rateLimiter.Increment("otp_send_signup", "hashed_test@example.com", TimeSpan.Zero)
        );
    }
}
