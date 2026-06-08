using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.CacheRateLimiterServices;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.AuthServices.OtpServices;

public class OtpService(
    ICacheService cache,
    IEmailService emailService,
    ICacheRateLimiterService rateLimiter,
    ILogger<OtpService> logger
) : IOtpService
{
    public OtpDetails CreateOtp(int otpValidForMinutes)
    {
        // Generate a 6-digit numeric OTP.
        var token = string.Concat(Enumerable.Range(0, 6).Select(_ => CryptoRandom.NextInt(10)));
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(otpValidForMinutes);

        return new OtpDetails { Value = token, ExpiresAt = expiresAt };
    }

    public async Task<Result<OtpResponse>> SendOtpAsync(
        string email,
        string purpose,
        CancellationToken ct
    )
    {
        var emailHash = logger.Hash(email);
        var verifyRateLimitScope = GetOtpVerifyRateLimitScope(purpose);
        var rateLimitScope = GetOtpSendRateLimitScope(purpose);

        // If verification attempts are currently locked out, do not send another OTP.
        var verifyRateLimitResult = rateLimiter.CheckLimit(
            verifyRateLimitScope,
            emailHash,
            OtpConfig.OtpMaxFailedVerificationAttempts,
            ErrorMessages.TooManyOtpVerificationAttempts
        );
        if (!verifyRateLimitResult.IsSuccess)
        {
            return Result<OtpResponse>.FromError(verifyRateLimitResult);
        }

        // Enforce per-email rate limit
        var rateLimitResult = rateLimiter.CheckLimit(
            rateLimitScope,
            emailHash,
            OtpConfig.OtpMaxSendRequestsPerWindow,
            ErrorMessages.TooManyOtpRequests
        );
        if (!rateLimitResult.IsSuccess)
        {
            return Result<OtpResponse>.FromError(rateLimitResult);
        }

        // Generate cache key for OTP storage
        var cacheKey = GetOtpCacheKey(emailHash, purpose);

        // Create OTP with configured validity
        var otpDetails = CreateOtp(OtpConfig.OtpLifetimeMinutes);

        // Send OTP via email service
        var emailResult = await emailService.SendOtpEmailAsync(
            to: email,
            otp: otpDetails.Value,
            otpValidFor: $"{OtpConfig.OtpLifetimeMinutes} minutes",
            ct: ct
        );

        // Return error if email sending fails
        if (!emailResult.IsSuccess)
        {
            return Result<OtpResponse>.FromError(emailResult);
        }

        // Increment rate limit counter only after successful send
        rateLimiter.Increment(
            rateLimitScope,
            emailHash,
            TimeSpan.FromMinutes(OtpConfig.OtpSendRateLimitWindowMinutes)
        );

        // Store OTP in cache with expiration
        cache.Set(cacheKey, otpDetails.Value, TimeSpan.FromMinutes(OtpConfig.OtpLifetimeMinutes));

        return Result<OtpResponse>.Success(new OtpResponse { OtpExpiresAt = otpDetails.ExpiresAt });
    }

    public Result VerifyOtp(string email, string otp, string purpose)
    {
        var emailHash = logger.Hash(email);
        var rateLimitScope = GetOtpVerifyRateLimitScope(purpose);
        var cacheKey = GetOtpCacheKey(emailHash, purpose);

        // Enforce failed-attempt verification rate limit.
        var rateLimitResult = rateLimiter.CheckLimit(
            rateLimitScope,
            emailHash,
            OtpConfig.OtpMaxFailedVerificationAttempts,
            ErrorMessages.TooManyOtpVerificationAttempts
        );
        if (!rateLimitResult.IsSuccess)
        {
            cache.Remove(cacheKey);
            return rateLimitResult;
        }

        // Missing OTP means it was never issued or has already expired.
        if (!cache.TryGetValue<string>(cacheKey, out var cachedOtp))
        {
            logger.LogWarning(
                "OTP verification failed for {EmailHash} (purpose: '{Purpose}')",
                emailHash,
                purpose
            );
            return Result.BadRequest(ErrorMessages.InvalidOrExpiredOtp);
        }

        // For incorrect OTP, increment failed-attempt counter and reject.
        if (!string.Equals(cachedOtp, otp, StringComparison.OrdinalIgnoreCase))
        {
            rateLimiter.Increment(
                rateLimitScope,
                emailHash,
                TimeSpan.FromMinutes(OtpConfig.OtpVerifyRateLimitWindowMinutes)
            );

            logger.LogWarning(
                "OTP verification failed for {EmailHash} (purpose: '{Purpose}')",
                emailHash,
                purpose
            );
            return Result.BadRequest(ErrorMessages.InvalidOrExpiredOtp);
        }
        else
        {
            // Successful verification clears failed-attempt tracking.
            rateLimiter.Reset(rateLimitScope, emailHash);

            // Mark email as verified for the specified purpose.
            var verifiedKey = GetVerifiedCacheKey(emailHash, purpose);
            cache.Set(verifiedKey, true, TimeSpan.FromMinutes(15));

            // Remove OTP from cache after successful verification.
            cache.Remove(cacheKey);
            return Result.NoContent();
        }
    }

    public bool IsVerified(string email, string purpose)
    {
        var emailHash = logger.Hash(email);

        // Check if email is verified for the specified purpose
        var verifiedKey = GetVerifiedCacheKey(emailHash, purpose);
        return cache.TryGetValue<bool>(verifiedKey, out _);
    }

    public void ClearVerification(string email, string purpose)
    {
        var emailHash = logger.Hash(email);

        // Remove verification status from cache
        var verifiedKey = GetVerifiedCacheKey(emailHash, purpose);
        cache.Remove(verifiedKey);
    }

    private static string GetOtpCacheKey(string emailHash, string purpose) =>
        $"otp_{purpose}_{emailHash}";

    private static string GetOtpSendRateLimitScope(string purpose) => $"otp_send_{purpose}";

    private static string GetOtpVerifyRateLimitScope(string purpose) => $"otp_verify_{purpose}";

    private static string GetVerifiedCacheKey(string emailHash, string purpose) =>
        $"verified_{purpose}_{emailHash}";
}
