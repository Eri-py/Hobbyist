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
    /// Starts a post: validates the manifest and returns a pre-signed upload URL per file. The post
    /// is created as a Draft; the client uploads the bytes directly to storage, then calls finalize
    /// (with <c>publish: true</c> to go live, or <c>false</c> to keep it a draft).
    /// </summary>
    [HttpPost("init")]
    [Authorize]
    public async Task<ActionResult<InitPostResponse>> InitAsync(
        [FromBody] InitPostRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postUploadService.InitAsync(request, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Verifies that a post's uploads have landed in storage. Publishes it when
    /// <see cref="FinalizeRequest.Publish"/> is true and all files are present; otherwise leaves it
    /// a draft. Returns the positions still missing if any are incomplete.
    /// </summary>
    [HttpPost("{slug}/finalize")]
    [Authorize]
    public async Task<ActionResult<FinalizeResponse>> FinalizeAsync(
        string slug,
        [FromBody] FinalizeRequest request,
        CancellationToken ct
    )
    {
        var userId = User.GetUserId();
        var result = await postUploadService.FinalizeAsync(slug, request.Publish, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>
    /// Discards a post and its uploaded media (drafts or in-progress posts). Performs a
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
