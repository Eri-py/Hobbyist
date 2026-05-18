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
    /// Creates a post in one shot (existing flow). Kept for backward compatibility.
    /// </summary>
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

    // -------------------------------------------------------------------------
    // Draft flow
    // -------------------------------------------------------------------------

    /// <summary>
    /// Uploads all selected media and creates a draft post that owns them.
    /// Called when the user taps "Next" on the media picker (mobile) or confirms
    /// their selection (web). Returns the draft post ID and an object key per file
    /// so the client can reference individual files for later removal.
    /// </summary>
    [HttpPost("draft")]
    [Authorize]
    public async Task<ActionResult<CreateDraftResponse>> CreateDraftAsync(
        IFormFile[] media,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postDraftService.CreateDraftAsync(media, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Adds a single media file to an existing draft post.
    /// Used on web when the user appends more files to the carousel after the
    /// initial upload.
    /// </summary>
    [HttpPost("{id:guid}/media")]
    [Authorize]
    public async Task<ActionResult<AddDraftMediaResponse>> AddMediaAsync(
        Guid id,
        IFormFile file,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postDraftService.AddMediaAsync(id, file, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Removes a single media file from a draft post's carousel.
    /// The client must supply the exact object key returned at upload time.
    /// The server validates that the key belongs to this post before deleting.
    /// </summary>
    [HttpDelete("{id:guid}/media")]
    [Authorize]
    public async Task<ActionResult> RemoveMediaAsync(
        Guid id,
        [FromBody] RemoveDraftMediaRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postDraftService.RemoveMediaAsync(id, request.ObjectKey, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Fills in the post form fields and publishes the draft.
    /// Validates server-side that at least one media file is associated before
    /// allowing the transition from draft to published.
    /// </summary>
    [HttpPost("{id:guid}/publish")]
    [Authorize]
    public async Task<ActionResult<CreatePostResponse>> PublishAsync(
        Guid id,
        [FromBody] PublishPostRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postDraftService.PublishDraftAsync(id, request, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Discards a draft post. Deletes the database record and performs a
    /// best-effort bulk deletion of all associated S3 objects.
    /// Called when the user cancels the create flow after tapping "Next".
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<ActionResult> DiscardAsync(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var result = await postDraftService.DiscardDraftAsync(id, userId, ct);
        return result.ToActionResult();
    }
}
