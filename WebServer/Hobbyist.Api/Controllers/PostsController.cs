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
    /// <summary>Starts a Draft post and returns a pre-signed upload URL per file; client uploads then calls finalize.</summary>
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

    /// <summary>Verifies uploads landed; publishes when <see cref="FinalizeRequest.Publish"/> and all present, else stays draft. Returns any still missing.</summary>
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

    /// <summary>Discards a draft/in-progress post: best-effort bulk-delete of storage objects, then the record.</summary>
    [HttpDelete("{slug}")]
    [Authorize]
    public async Task<ActionResult> DiscardAsync(string slug, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var result = await postUploadService.DiscardAsync(slug, userId, ct);
        return result.ToActionResult();
    }
}
