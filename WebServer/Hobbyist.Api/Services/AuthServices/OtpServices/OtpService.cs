using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.CacheServices;
using Hobbyist.Api.Services.EmailServices;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.AuthServices.OtpServices;

public class OtpService(ICache cache, IEmailService emailService) : IOtpService
{
    public OtpDetails CreateOtp(int otpValidForMinutes)
    {
        // Generate 6-digit OTP with leading zeros
        var token = (CryptoRandom.NextInt() % 1000000).ToString("000000");
        var expiresAt = DateTime.UtcNow.AddMinutes(otpValidForMinutes);

        return new OtpDetails { Value = token, ExpiresAt = expiresAt };
    }

    public async Task<Result<OtpResponse>> SendOtpAsync(string email, string purpose)
    {
        // Generate cache key for OTP storage
        var cacheKey = GetOtpCacheKey(email, purpose);

        // Create OTP with configured validity
        var otpDetails = CreateOtp(AuthConfig.OtpValidForMinutes);

        // Send OTP via email service
        var emailResult = await emailService.SendOtpEmailAsync(
            to: email,
            otp: otpDetails.Value,
            otpValidFor: $"{AuthConfig.OtpValidForMinutes} minutes"
        );

        // Return error if email sending fails
        if (!emailResult.IsSuccess)
        {
            return Result<OtpResponse>.FromError(emailResult);
        }

        // Store OTP in cache with expiration
        cache.Set(cacheKey, otpDetails.Value, TimeSpan.FromMinutes(AuthConfig.OtpValidForMinutes));

        // Return success with expiration time
        return Result<OtpResponse>.Success(new OtpResponse { OtpExpiresAt = otpDetails.ExpiresAt });
    }

    public Result VerifyOtp(string email, string otp, string purpose)
    {
        // Get cache key and retrieve stored OTP
        var cacheKey = GetOtpCacheKey(email, purpose);

        // Validate OTP against stored value
        if (!cache.TryGetValue<string>(cacheKey, out var cachedOtp) || cachedOtp?.ToString() != otp)
        {
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

    private static string GetVerifiedCacheKey(string email, string purpose) =>
        $"verified_{purpose}_{email}";
}
