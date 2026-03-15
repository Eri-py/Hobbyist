using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

/// <summary>
/// Contains username and email to initiate the sign-up process.
/// </summary>
public record class StartSignUpRequest
{
    [Required]
    public required string Username { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

public record class VerifyOtpResponse
{
    [Required]
    public required string[] PopularInterests { get; set; }
}

/// <summary>
/// Contains complete user profile information including personal details and password.
/// </summary>
public record class CompleteSignUpRequest
{
    [Required]
    public required string Username { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string Password { get; set; }

    [Required]
    public required string Firstname { get; set; }

    [Required]
    public required string Lastname { get; set; }

    [Required]
    public required string DateOfBirth { get; set; }

    [Required]
    public required string[] Interests { get; set; }
}
