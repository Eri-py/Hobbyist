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

    /// <summary>
    /// Uploads all media files for a post while collecting uploaded object keys for rollback.
    /// </summary>
    Task<Result> StorePostMediaAsync(
        IFormFile[] media,
        string userId,
        string postId,
        ICollection<string> uploadedObjectKeys,
        CancellationToken ct
    );

    /// <summary>
    /// Persists post metadata to the database after media storage succeeds.
    /// </summary>
    Task<Result> StorePostDetailsAsync(
        CreatePostRequest request,
        Guid userId,
        string postId,
        DateTimeOffset createdAt,
        CancellationToken ct
    );
}
