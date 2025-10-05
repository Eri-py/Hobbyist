using System.Security.Claims;
using Hobbyist.Api.Dtos;

namespace Hobbyist.Api.Controllers;

/// <summary>
/// Helper class containing static methods that are likely to be used throughout the controller layer.
/// </summary>
public class ApiHelper
{
    /// <summary>
    /// Extracts the user information from the Claims and stores it in a transferable user dto.
    /// </summary>
    /// <param name="user">Claim principals containing information about the user. See <see cref="ClaimsPrincipal"/></param>
    /// <returns><see cref="UserDto"/> </returns>
    public static UserDto GetUserDetails(ClaimsPrincipal user)
    {
        return new UserDto
        {
            Id = user.FindFirst(ClaimTypes.NameIdentifier)!.Value,
            Username = user.Identity!.Name!,
            Email = user.FindFirst(ClaimTypes.Email)!.Value,
            Firstname = user.FindFirst(ClaimTypes.GivenName)!.Value,
            Lastname = user.FindFirst(ClaimTypes.Surname)!.Value,
        };
    }
}
