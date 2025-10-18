using System;
using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.AuthServices.OtpServices;

public record OtpDetails
{
    public required string Value { get; set; }
    public required DateTime ExpiresAt { get; set; }
}

public interface IOtpService
{
    public OtpDetails CreateOtp(int otpValidForMinutes);
    public Task<Result<OtpResponse>> SendOtpAsync(string email, string purpose);
    public Result VerifyOtp(string email, string otp, string purpose);
    public bool IsVerified(string email, string purpose);
    public void ClearVerification(string email, string purpose);
}
