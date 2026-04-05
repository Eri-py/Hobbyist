using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.PostServices.CreatePostServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PostsController(ICreatePostService createPostService) : ControllerBase
{
    [HttpPost("create")]
    [Authorize]
    public async Task<ActionResult<CreatePostResponse>> CreateAsync(
        [FromForm] CreatePostRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();

        var result = await createPostService.CreatePostAsync(request, userId, ct);
        return result.ToActionResult();
    }
}
