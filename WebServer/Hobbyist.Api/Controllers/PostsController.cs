using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.PostServices.CreatePostServices;
using Hobbyist.Api.Services.PostServices.PostDraftServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PostsController(
    ICreatePostService createPostService,
    IPostDraftService postDraftService
) : ControllerBase
{
    /// <summary>
    /// Creates and publishes a post in one shot (mobile optimistic-post flow).
    /// </summary>
    [HttpPost("create")]
    [Authorize]
    [RequestFormLimits(MultipartBodyLengthLimit = 105_000_000)]
    public async Task<ActionResult<CreatePostResponse>> CreateAsync(
        [FromForm] CreatePostRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await createPostService.CreatePostAsync(request, userId, ct);
        return result.ToActionResult();
    }

    // -------------------------------------------------------------------------
    // Draft flow
    // -------------------------------------------------------------------------

    /// <summary>
    /// Saves a complete draft — all form fields and media in one request.
    /// The draft sits on the server until the user chooses to publish it.
    /// </summary>
    [HttpPost("draft")]
    [Authorize]
    [RequestFormLimits(MultipartBodyLengthLimit = 105_000_000)]
    public async Task<ActionResult<CreateDraftResponse>> CreateDraftAsync(
        [FromForm] SaveDraftRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postDraftService.CreateDraftAsync(request, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Publishes a saved draft. All required data is already on the draft;
    /// no additional fields are needed from the caller.
    /// </summary>
    [HttpPost("{slug}/publish")]
    [Authorize]
    public async Task<ActionResult<CreatePostResponse>> PublishAsync(
        string slug,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postDraftService.PublishDraftAsync(slug, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Discards a draft post. Deletes the database record and performs a
    /// best-effort bulk deletion of all associated S3 objects.
    /// </summary>
    [HttpDelete("{slug}")]
    [Authorize]
    public async Task<ActionResult> DiscardAsync(string slug, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var result = await postDraftService.DiscardDraftAsync(slug, userId, ct);
        return result.ToActionResult();
    }
}
