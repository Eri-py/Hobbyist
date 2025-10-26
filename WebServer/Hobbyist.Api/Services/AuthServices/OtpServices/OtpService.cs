using System;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Common;
using Microsoft.Extensions.Caching.Memory;

namespace Hobbyist.Api.Services.AuthServices.OtpServices;

public class OtpService(ICache cache, IEmailService emailService) : IOtpService
{
    public OtpDetails CreateOtp(int otpValidForMinutes)
    {
        var token = (CryptoRandom.NextInt() % 1000000).ToString("000000");
        var expiresAt = DateTime.UtcNow.AddMinutes(otpValidForMinutes);
        return new OtpDetails { Value = token, ExpiresAt = expiresAt };
    }

    public async Task<Result<OtpResponse>> SendOtpAsync(string email, string purpose)
    {
        // Generate cache key
        var cacheKey = GetOtpCacheKey(email, purpose);

        // Generate OTP and send verification email.
        var otpDetails = CreateOtp(AuthConfig.OtpValidForMinutes);
        var emailResult = await emailService.SendOtpEmailAsync(
            to: email,
            otp: otpDetails.Value,
            otpValidFor: $"{AuthConfig.OtpValidForMinutes} minutes"
        );

        if (!emailResult.IsSuccess)
        {
            return Result<OtpResponse>.FromError(emailResult);
        }

        cache.Set(cacheKey, otpDetails.Value, TimeSpan.FromMinutes(AuthConfig.OtpValidForMinutes));
        return Result<OtpResponse>.Success(new OtpResponse { OtpExpiresAt = otpDetails.ExpiresAt });
    }

    public Result VerifyOtp(string email, string otp, string purpose)
    {
        var cacheKey = GetOtpCacheKey(email, purpose);

        if (!cache.TryGetValue<string>(cacheKey, out var cachedOtp) || cachedOtp?.ToString() != otp)
        {
            return Result.BadRequest("Invalid or expired verification code");
        }

        // Mark email as verified for this purpose
        var verifiedKey = GetVerifiedCacheKey(email, purpose);
        cache.Set(verifiedKey, true, TimeSpan.FromMinutes(15));

        cache.Remove(cacheKey);
        return Result.NoContent();
    }

    public bool IsVerified(string email, string purpose)
    {
        var verifiedKey = GetVerifiedCacheKey(email, purpose);
        return cache.TryGetValue<bool>(verifiedKey, out _);
    }

    public void ClearVerification(string email, string purpose)
    {
        var verifiedKey = GetVerifiedCacheKey(email, purpose);
        cache.Remove(verifiedKey);
    }

    private static string GetOtpCacheKey(string email, string purpose) => $"otp_{purpose}_{email}";

    private static string GetVerifiedCacheKey(string email, string purpose) =>
        $"verified_{purpose}_{email}";
}
