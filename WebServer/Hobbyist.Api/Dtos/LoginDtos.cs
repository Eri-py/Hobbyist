using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

/// <summary>
/// Defines the shape of data expected from the web client when initiating a login.
/// </summary>
public record class StartLoginRequest
{
    /// <summary>
    /// The username or email address to login with.
    /// </summary>
    [Required]
    public required string Identifier { get; set; }

    /// <summary>
    /// The account password.
    /// </summary>
    [Required]
    public required string Password { get; set; }
}

/// <summary>
/// Defines the shape of data returned to the web client after initiating login.
/// </summary>
public record class StartLoginResponse
{
    /// <summary>
    /// The expiration time of the OTP in ISO 8601 format.
    /// </summary>
    [Required]
    public required string OtpExpiresAt { get; set; }

    /// <summary>
    /// The email address where the OTP was sent (partially masked for security).
    /// </summary>
    [Required]
    public required string Email { get; set; }
}

/// <summary>
/// Defines the shape of data expected from the web client to complete login with OTP verification.
/// </summary>
public record class CompleteLoginRequest
{
    /// <summary>
    /// The username or email address used to initiate login.
    /// </summary>
    [Required]
    public required string Identifier { get; set; }

    /// <summary>
    /// The 6-digit One-Time Passcode received via email.
    /// </summary>
    [Required]
    public required string Otp { get; set; }
}
