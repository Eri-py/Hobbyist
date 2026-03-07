using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.OtpServices;

public class OtpService(ICache cache, IEmailService emailService, ILogger<OtpService> logger)
    : IOtpService
{
    public OtpDetails CreateOtp(int otpValidForMinutes)
    {
        // Generate 6-character alphanumeric OTP (case-insensitive, uppercase)
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var token = new string(
            [.. Enumerable.Range(0, 6).Select(_ => chars[CryptoRandom.NextInt() % chars.Length])]
        );
        var expiresAt = DateTime.UtcNow.AddMinutes(otpValidForMinutes);

        return new OtpDetails { Value = token, ExpiresAt = expiresAt };
    }

    public async Task<Result<OtpResponse>> SendOtpAsync(string email, string purpose)
    {
        // Enforce per-email rate limit
        var rateLimitResult = CheckSendRateLimit(email, purpose);
        if (!rateLimitResult.IsSuccess)
        {
            return Result<OtpResponse>.FromError(rateLimitResult);
        }

        // Generate cache key for OTP storage
        var cacheKey = GetOtpCacheKey(email, purpose);

        // Create OTP with configured validity
        var otpDetails = CreateOtp(OtpConfig.OtpValidForMinutes);

        // Send OTP via email service
        var emailResult = await emailService.SendOtpEmailAsync(
            to: email,
            otp: otpDetails.Value,
            otpValidFor: $"{OtpConfig.OtpValidForMinutes} minutes"
        );

        // Return error if email sending fails
        if (!emailResult.IsSuccess)
        {
            return Result<OtpResponse>.FromError(emailResult);
        }

        // Increment rate limit counter only after successful send
        IncrementSendRateLimit(email, purpose);

        // Store OTP in cache with expiration
        cache.Set(cacheKey, otpDetails.Value, TimeSpan.FromMinutes(OtpConfig.OtpValidForMinutes));

        return Result<OtpResponse>.Success(new OtpResponse { OtpExpiresAt = otpDetails.ExpiresAt });
    }

    public Result VerifyOtp(string email, string otp, string purpose)
    {
        // Get cache key and retrieve stored OTP
        var cacheKey = GetOtpCacheKey(email, purpose);

        // Validate OTP against stored value
        if (
            !cache.TryGetValue<string>(cacheKey, out var cachedOtp)
            || !string.Equals(cachedOtp, otp, StringComparison.OrdinalIgnoreCase)
        )
        {
            logger.LogWarning(
                "OTP verification failed for {Email} (purpose: '{Purpose}')",
                email,
                purpose
            );
            return Result.BadRequest(ErrorMessages.InvalidOrExpiredOtp);
        }

        // Mark email as verified for the specified purpose
        var verifiedKey = GetVerifiedCacheKey(email, purpose);
        cache.Set(verifiedKey, true, TimeSpan.FromMinutes(15));

        // Remove OTP from cache after successful verification
        cache.Remove(cacheKey);
        return Result.NoContent();
    }

    public bool IsVerified(string email, string purpose)
    {
        // Check if email is verified for the specified purpose
        var verifiedKey = GetVerifiedCacheKey(email, purpose);
        return cache.TryGetValue<bool>(verifiedKey, out _);
    }

    public void ClearVerification(string email, string purpose)
    {
        // Remove verification status from cache
        var verifiedKey = GetVerifiedCacheKey(email, purpose);
        cache.Remove(verifiedKey);
    }

    private static string GetOtpCacheKey(string email, string purpose) => $"otp_{purpose}_{email}";

    private Result CheckSendRateLimit(string email, string purpose)
    {
        var rateLimitKey = $"ratelimit_otp_{purpose}_{email}";
        cache.TryGetValue<OtpRateLimitEntry>(rateLimitKey, out var entry);

        if (entry is not null && entry.Count >= OtpConfig.OtpMaxSendsPerWindow)
        {
            logger.LogWarning(
                "OTP send rate limit exceeded for {Email} (purpose: '{Purpose}')",
                email,
                purpose
            );
            return Result.TooManyRequests(ErrorMessages.TooManyOtpRequests);
        }

        return Result.NoContent();
    }

    private void IncrementSendRateLimit(string email, string purpose)
    {
        var rateLimitKey = $"ratelimit_otp_{purpose}_{email}";
        cache.TryGetValue<OtpRateLimitEntry>(rateLimitKey, out var entry);

        // Anchor window on first request for fixed window.
        var windowExpiry =
            entry?.WindowExpiry ?? DateTime.UtcNow.AddMinutes(OtpConfig.OtpRateLimitWindowMinutes);

        cache.Set(
            rateLimitKey,
            new OtpRateLimitEntry(Count: (entry?.Count ?? 0) + 1, WindowExpiry: windowExpiry),
            windowExpiry - DateTime.UtcNow
        );
    }

    private static string GetVerifiedCacheKey(string email, string purpose) =>
        $"verified_{purpose}_{email}";
}
