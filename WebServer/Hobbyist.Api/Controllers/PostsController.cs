using Hobbyist.Api.Dtos;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.PostServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PostsController(IPostService postService) : ControllerBase
{
    [HttpPost("create")]
    [Authorize]
    public async Task<ActionResult<CreatePostResponse>> CreateAsync(
        [FromForm] CreatePostRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();

        var result = await postService.CreatePostAsync(request, userId, ct);
        return result.ToActionResult();
    }
}
