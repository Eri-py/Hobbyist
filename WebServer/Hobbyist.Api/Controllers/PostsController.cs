using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PostsController : ControllerBase
{
    [HttpPost("create")]
    [Authorize]
    public ActionResult Create(
        [FromForm] string hobby,
        [FromForm] string title,
        [FromForm] string description,
        [FromForm] bool availableForTrade,
        [FromForm] string? lookingFor,
        [FromForm] IFormFile[] media
    )
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var username = User.Identity?.Name ?? "unknown";

        Console.WriteLine("[CreatePost] ------------------------------");
        Console.WriteLine($"UserId: {userId}");
        Console.WriteLine($"Username: {username}");
        Console.WriteLine($"Hobby: {hobby}");
        Console.WriteLine($"Title: {title}");
        Console.WriteLine($"Description: {description}");
        Console.WriteLine($"AvailableForTrade: {availableForTrade}");
        Console.WriteLine($"LookingFor: {lookingFor ?? "(none)"}");
        Console.WriteLine($"MediaCount: {media.Length}");

        for (var index = 0; index < media.Length; index++)
        {
            var file = media[index];
            Console.WriteLine(
                $"Media[{index}] Name={file.FileName}, ContentType={file.ContentType}, Size={file.Length}"
            );
        }

        Console.WriteLine("[CreatePost] ------------------------------");

        return Ok(new { message = "Create post payload received." });
    }
}
