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

public record CompleteSignUpRequest
{
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
}
