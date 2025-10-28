using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.AuthDtos;

/// <summary>
/// Response containing current user authentication status and user data if authenticated.
/// </summary>
public record class GetUserResponse
{
    [Required]
    public required bool IsAuthenticated { get; set; }

    public UserDto? User { get; set; }
}
