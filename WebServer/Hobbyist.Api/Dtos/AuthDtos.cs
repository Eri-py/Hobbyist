using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

/// <summary>
/// Defines the shape of data expected from the web client when starting registration.
/// </summary>
public record class CompleteRegistrationRequest
{
    /// <summary>
    /// The username for the new account.
    /// </summary>
    [Required]
    public required string Username { get; set; }

    /// <summary>
    /// The email address for the new account.
    /// </summary>
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    /// <summary>
    /// The password for the new account.
    /// </summary>
    [Required]
    public required string Password { get; set; }

    /// <summary>
    /// The user's first name.
    /// </summary>
    [Required]
    public required string Firstname { get; set; }

    /// <summary>
    /// The user's last name.
    /// </summary>
    [Required]
    public required string Lastname { get; set; }

    /// <summary>
    /// The user's date of birth in ISO 8601 format (YYYY-MM-DD).
    /// </summary>
    [Required]
    public required string DateOfBirth { get; set; }
}

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

/// <summary>
/// Defines the shape of user data returned to the web client when requesting current user information.
/// </summary>
public record class GetUserResponse
{
    /// <summary>
    /// Indicates whether the current session is authenticated.
    /// </summary>
    [Required]
    public required bool IsAuthenticated { get; set; }

    /// <summary>
    /// The user data if authenticated, otherwise null.
    /// </summary>
    public UserDto? User { get; set; }
}
