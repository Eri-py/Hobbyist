using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.Auth.OtpServices;

/// <summary>
/// Contains OTP value and expiration information.
/// </summary>
public record OtpDetails
{
    public required string Value { get; set; }
    public required DateTime ExpiresAt { get; set; }
}

public interface IOtpService
{
    /// <summary>
    /// Creates a One-Time Password with specified validity duration.
    /// </summary>
    /// <param name="otpValidForMinutes">OTP validity duration in minutes</param>
    /// <returns><see cref="OtpDetails"/> containing the OTP and expiration</returns>
    public OtpDetails CreateOtp(int otpValidForMinutes);

    /// <summary>
    /// Sends an OTP to the specified email address for verification.
    /// </summary>
    /// <param name="email">The email address to send OTP to</param>
    /// <param name="purpose">The purpose of the OTP verification</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="OtpResponse"/></returns>
    public Task<Result<OtpResponse>> SendOtpAsync(
        string email,
        string purpose,
        CancellationToken ct
    );

    /// <summary>
    /// Verifies the provided OTP against the stored value.
    /// </summary>
    /// <param name="email">The email address associated with the OTP</param>
    /// <param name="otp">The OTP code to verify</param>
    /// <param name="purpose">The purpose of the OTP verification</param>
    /// <returns><see cref="Result"/></returns>
    public Result VerifyOtp(string email, string otp, string purpose);

    /// <summary>
    /// Checks if the email has been verified for the specified purpose.
    /// </summary>
    /// <param name="email">The email address to check</param>
    /// <param name="purpose">The purpose of the verification</param>
    /// <returns>True if email is verified, false otherwise</returns>
    public bool IsVerified(string email, string purpose);

    /// <summary>
    /// Clears the verification status for the specified email and purpose.
    /// </summary>
    /// <param name="email">The email address to clear verification for</param>
    /// <param name="purpose">The purpose of the verification</param>
    public void ClearVerification(string email, string purpose);
}
