using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

/// <summary>
/// Contains email and OTP code for email verification during sign-up.
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
/// Contains email address to resend OTP to.
/// </summary>
public record class ResendOtpRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

/// <summary>
/// Contains OTP expiration information.
/// </summary>
public record OtpResponse
{
    [Required]
    public required DateTime OtpExpiresAt { get; set; }
}
