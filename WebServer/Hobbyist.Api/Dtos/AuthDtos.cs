using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

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
