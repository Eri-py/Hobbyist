using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

public record class StartSignUpRequest
{
    /// <summary>
    /// The desired username for the new account. Must be unique.
    /// </summary>
    [Required]
    public required string Username { get; set; }

    /// <summary>
    /// The email address for the new account. Must be valid and unique.
    /// </summary>
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

/// <summary>
/// Defines the shape of data expected from the web client when starting registration.
/// </summary>
public record class CompleteSignUpRequest
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
