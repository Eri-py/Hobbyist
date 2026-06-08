using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.PostServices.PostUploadServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PostsController(IPostUploadService postUploadService) : ControllerBase
{
    /// <summary>
    /// Starts publishing a post: validates the manifest and returns a pre-signed upload URL per file.
    /// The client uploads the bytes directly to storage, then calls finalize.
    /// </summary>
    [HttpPost("init")]
    [Authorize]
    public async Task<ActionResult<InitPostResponse>> InitPublishAsync(
        [FromBody] InitPublishRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postUploadService.InitPublishAsync(request, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Starts a draft. Like <c>init</c> but the post is saved in the Draft state and metadata may be incomplete.
    /// </summary>
    [HttpPost("init-draft")]
    [Authorize]
    public async Task<ActionResult<InitPostResponse>> InitDraftAsync(
        [FromBody] InitDraftRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postUploadService.InitDraftAsync(request, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Verifies that a post's uploads have landed in storage and publishes it (works for an
    /// in-progress post or a completed draft). Returns the positions still missing if any are incomplete.
    /// </summary>
    [HttpPost("{slug}/finalize")]
    [Authorize]
    public async Task<ActionResult<FinalizeResponse>> FinalizeAsync(
        string slug,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postUploadService.FinalizeAsync(slug, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Re-issues pre-signed upload URLs for files that are still pending (e.g. the originals expired).
    /// </summary>
    [HttpPost("{slug}/uploads/refresh")]
    [Authorize]
    public async Task<ActionResult<RefreshUploadsResponse>> RefreshUploadsAsync(
        string slug,
        [FromBody] RefreshUploadsRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postUploadService.RefreshUploadsAsync(slug, request, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Discards a post and its uploaded media (drafts, in-progress or failed posts). Performs a
    /// best-effort bulk deletion of the associated storage objects before removing the record.
    /// </summary>
    [HttpDelete("{slug}")]
    [Authorize]
    public async Task<ActionResult> DiscardAsync(string slug, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var result = await postUploadService.DiscardAsync(slug, userId, ct);
        return result.ToActionResult();
    }
}
