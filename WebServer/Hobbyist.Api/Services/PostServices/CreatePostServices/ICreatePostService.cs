using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.PostServices.CreatePostServices;

public interface ICreatePostService
{
    /// <summary>
    /// Orchestrates full post creation: validates request input, stores media,
    /// persists post details, and returns the final API response payload.
    /// </summary>
    /// <param name="request">Incoming create-post payload from the client.</param>
    /// <param name="userId">Authenticated user identifier as a string claim value.</param>
    /// <param name="ct">Cancellation token for cooperative cancellation.</param>
    /// <returns>
    /// Success with <see cref="CreatePostResponse"/> when all steps complete,
    /// otherwise an error <see cref="Result{T}"/> describing the failure.
    /// </returns>
    Task<Result<CreatePostResponse>> CreatePostAsync(
        CreatePostRequest request,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Uploads all media files for a post and produces post-facing media references
    /// (object key, read URL, content type, and size).
    /// </summary>
    /// <param name="media">Files attached to the create-post request.</param>
    /// <param name="userId">Owner user identifier used to scope storage keys.</param>
    /// <param name="postId">Post identifier used to group media under one post path.</param>
    /// <param name="ct">Cancellation token for cooperative cancellation.</param>
    /// <returns>
    /// Success with media references for all files, or an error result if any upload/URL step fails.
    /// </returns>
    Task<Result<List<PostMediaReference>>> StorePostMediaAsync(
        IFormFile[] media,
        string userId,
        Guid postId,
        CancellationToken ct
    );

    /// <summary>
    /// Persists post metadata to the database after media storage succeeds.
    /// </summary>
    /// <param name="request">Create-post payload containing post fields to persist.</param>
    /// <param name="userId">Typed user identifier that owns the post.</param>
    /// <param name="postId">Identifier to assign to the new post record.</param>
    /// <param name="createdAt">Creation timestamp to persist with the post.</param>
    /// <param name="ct">Cancellation token for cooperative cancellation.</param>
    /// <returns>
    /// <see cref="Result.NoContent"/> on success, otherwise an error <see cref="Result"/>.
    /// </returns>
    Task<Result> StorePostDetailsAsync(
        CreatePostRequest request,
        Guid userId,
        Guid postId,
        DateTimeOffset createdAt,
        CancellationToken ct
    );
}
