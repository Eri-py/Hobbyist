using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices;

public interface IPostService
{
    /// <summary>
    /// Creates a post and uploads all attached media through the configured media storage provider.
    /// </summary>
    /// <param name="request">The post payload with attached files</param>
    /// <param name="userId">The authenticated user identifier</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="CreatePostResponse"/></returns>
    Task<Result<CreatePostResponse>> CreatePostAsync(
        CreatePostRequest request,
        string userId,
        CancellationToken ct
    );
}
