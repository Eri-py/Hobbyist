using Hobbyist.Api.Dtos.Posts;
using Hobbyist.Common;
using Microsoft.AspNetCore.Http;

namespace Hobbyist.Api.Services.PostServices.PostDraftServices;

public interface IPostDraftService
{
    /// <summary>
    /// Uploads all <paramref name="media"/> files and creates a draft post that owns them.
    /// Rolls back any successful uploads if a later upload or the database save fails.
    /// </summary>
    /// <param name="media">One or more files to upload. Must not be empty or exceed <see cref="PostDraftConfig.MaxMediaFiles"/>.</param>
    /// <param name="userId">Authenticated user identifier as a string claim value.</param>
    /// <returns>
    /// Success with <see cref="CreateDraftResponse"/> (postId + object keys) on success,
    /// otherwise an error result describing the failure.
    /// </returns>
    Task<Result<CreateDraftResponse>> CreateDraftAsync(
        IFormFile[] media,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Uploads a single file and adds it to an existing draft post.
    /// The draft's <c>MediaCount</c> is incremented atomically on success.
    /// Rolls back the upload if the database save fails.
    /// </summary>
    /// <param name="postId">The draft post to add media to.</param>
    /// <param name="file">The file to upload.</param>
    /// <param name="userId">Authenticated user identifier — must match the post owner.</param>
    Task<Result<AddDraftMediaResponse>> AddMediaAsync(
        Guid postId,
        IFormFile file,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Deletes a single media file from a draft post's S3 storage and
    /// decrements the post's <c>MediaCount</c>.
    /// The <paramref name="objectKey"/> must belong to the target post
    /// (i.e. start with <c>{userId}/{postId}/</c>) — the server validates this.
    /// </summary>
    /// <param name="postId">The draft post to remove media from.</param>
    /// <param name="objectKey">
    /// Exact S3 object key previously returned by <see cref="CreateDraftAsync"/> or
    /// <see cref="AddMediaAsync"/>.
    /// </param>
    /// <param name="userId">Authenticated user identifier — must match the post owner.</param>
    Task<Result> RemoveMediaAsync(
        Guid postId,
        string objectKey,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Applies the supplied form fields to a draft post and marks it as published.
    /// Validates that at least one media file is associated with the post before publishing.
    /// </summary>
    /// <param name="postId">The draft post to publish.</param>
    /// <param name="request">Form fields to store on the published post.</param>
    /// <param name="userId">Authenticated user identifier — must match the post owner.</param>
    /// <returns>
    /// Success with <see cref="CreatePostResponse"/> on success,
    /// otherwise an error result describing the failure.
    /// </returns>
    Task<Result<CreatePostResponse>> PublishDraftAsync(
        Guid postId,
        PublishPostRequest request,
        string userId,
        CancellationToken ct
    );

    /// <summary>
    /// Deletes a draft post from the database and performs a best-effort
    /// bulk deletion of all associated S3 objects. Storage failures are logged
    /// as warnings but do not prevent the database record from being removed.
    /// </summary>
    /// <param name="postId">The draft post to discard.</param>
    /// <param name="userId">Authenticated user identifier — must match the post owner.</param>
    Task<Result> DiscardDraftAsync(Guid postId, string userId, CancellationToken ct);
}
