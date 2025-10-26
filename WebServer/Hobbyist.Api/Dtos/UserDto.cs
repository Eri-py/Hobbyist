using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

/// <summary>
/// Defines a transferable user. Stores non-sensitive information like the username, and name of user.
/// </summary>
public record class UserDto
{
    [Required]
    public required string Id { get; set; }

    [Required]
    public required string Username { get; set; }

    [Required]
    public required string Email { get; set; }

    [Required]
    public required string Firstname { get; set; }

    [Required]
    public required string Lastname { get; set; }
}
