using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.AuthDtos;

/// <summary>
/// Credentials for initiating the login process.
/// </summary>
public record class StartLoginRequest
{
    [Required]
    public required string Identifier { get; set; }

    [Required]
    public required string Password { get; set; }
}

/// <summary>
/// Response after initiating login, containing OTP expiration and destination email.
/// </summary>
public record class StartLoginResponse
{
    [Required]
    public required string OtpExpiresAt { get; set; }

    [Required]
    public required string Email { get; set; }
}

/// <summary>
/// Request to complete login using received OTP code.
/// </summary>
public record class CompleteLoginRequest
{
    [Required]
    public required string Identifier { get; set; }

    [Required]
    public required string Otp { get; set; }
}
