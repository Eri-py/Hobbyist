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

        var cacheKey = GetOtpCacheKey(emailHash, purpose);
        var otpDetails = CreateOtp(OtpConfig.OtpLifetimeMinutes);

        var emailResult = await emailService.SendOtpEmailAsync(
            to: email,
            otp: otpDetails.Value,
            otpValidFor: $"{OtpConfig.OtpLifetimeMinutes} minutes",
            ct: ct
        );

        if (!emailResult.IsSuccess)
        {
            return Result<OtpResponse>.FromError(emailResult);
        }

        // Count against the send limit only after a successful send.
        rateLimiter.Increment(
            rateLimitScope,
            emailHash,
            TimeSpan.FromMinutes(OtpConfig.OtpSendRateLimitWindowMinutes)
        );

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
            rateLimiter.Reset(rateLimitScope, emailHash);

            var verifiedKey = GetVerifiedCacheKey(emailHash, purpose);
            cache.Set(verifiedKey, true, TimeSpan.FromMinutes(15));

            cache.Remove(cacheKey);
            return Result.NoContent();
        }
    }

    public bool IsVerified(string email, string purpose)
    {
        var emailHash = logger.Hash(email);

        var verifiedKey = GetVerifiedCacheKey(emailHash, purpose);
        return cache.TryGetValue<bool>(verifiedKey, out _);
    }

    public void ClearVerification(string email, string purpose)
    {
        var emailHash = logger.Hash(email);

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
