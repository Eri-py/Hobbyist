using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.CreatePostServices;

public interface ICreatePostService
{
    /// <summary>
    /// Orchestrates full post creation: validates request input, stores media,
    /// persists post details, and returns the final API response payload.
    /// </summary>
    Task<Result<CreatePostResponse>> CreatePostAsync(
        CreatePostRequest request,
        string userId,
        CancellationToken ct
    );

}
