using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

/// <summary>
/// Request to verify email address using OTP code during sign-up.
/// </summary>
public record class VerifyOtpRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [Length(6, 6, ErrorMessage = "Must be 6 digits")]
    public required string Otp { get; set; }
}

/// <summary>
/// Request to resend OTP code to specified email address.
/// </summary>
public record class ResendOtpRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

/// <summary>
/// Response containing OTP expiration timestamp.
/// </summary>
public record OtpResponse
{
    [Required]
    public required DateTime OtpExpiresAt { get; set; }
}
