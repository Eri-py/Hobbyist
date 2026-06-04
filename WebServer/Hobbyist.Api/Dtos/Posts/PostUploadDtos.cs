using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos.Posts;

/// <summary>One entry in the upload manifest — describes a file the client intends to upload.</summary>
public record class MediaManifestItem
{
    /// <summary>Display order within the post (1-based). Also the handle the client uses to match
    /// a returned upload URL back to its file.</summary>
    public required int Position { get; set; }

    /// <summary>Original file name; the server derives the stored extension from this.</summary>
    [Required]
    public required string FileName { get; set; }

    [Required]
    public required string ContentType { get; set; }

    public required long ByteSize { get; set; }
}

/// <summary>
/// Request to start publishing a post. Metadata is required; the server creates the post in the
/// Uploading state and returns a pre-signed upload URL per manifest item.
/// </summary>
public record class InitPublishRequest
{
    [Required]
    [MinLength(2)]
    [MaxLength(50)]
    public required string Hobby { get; set; }

    [Required]
    [MinLength(3)]
    [MaxLength(100)]
    public required string Title { get; set; }

    [Required]
    [MinLength(10)]
    [MaxLength(2000)]
    public required string Description { get; set; }

    public required bool AvailableForTrade { get; set; }

    [MaxLength(500)]
    public string? LookingFor { get; set; }

    [Required]
    public required MediaManifestItem[] Media { get; set; }
}

/// <summary>
/// Request to start a draft. Metadata is optional so the user can save at any point; only the
/// media manifest is required. The server creates the post in the Draft state.
/// </summary>
public record class InitDraftRequest
{
    [MinLength(2)]
    [MaxLength(50)]
    public string? Hobby { get; set; }

    [MinLength(3)]
    [MaxLength(100)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public bool AvailableForTrade { get; set; }

    [MaxLength(500)]
    public string? LookingFor { get; set; }

    [Required]
    public required MediaManifestItem[] Media { get; set; }
}

/// <summary>A single pre-signed upload target returned to the client, paired with its manifest position.</summary>
public record class PresignedUpload
{
    public required int Position { get; set; }

    [Required]
    public required string Url { get; set; }

    /// <summary>Headers the client must send on the PUT for the signature to match (e.g. Content-Type).</summary>
    [Required]
    public required IReadOnlyDictionary<string, string> RequiredHeaders { get; set; }

    public required DateTimeOffset ExpiresAt { get; set; }
}

/// <summary>Returned from init: the new post slug and the per-file upload targets.</summary>
public record class InitPostResponse
{
    [Required]
    public required string Slug { get; set; }

    [Required]
    public required PresignedUpload[] Uploads { get; set; }
}

/// <summary>Outcome of finalizing a post.</summary>
public record class FinalizeResponse
{
    /// <summary>True when every file was verified and the post is now live.</summary>
    public required bool Published { get; set; }

    /// <summary>Positions whose object was not yet found in storage; the client re-uploads and finalizes again.</summary>
    public required int[] PendingPositions { get; set; }
}

/// <summary>Request to re-issue pre-signed upload URLs for files that are still pending (e.g. expired).</summary>
public record class RefreshUploadsRequest
{
    [Required]
    public required int[] Positions { get; set; }
}

/// <summary>Fresh pre-signed upload targets for the requested pending files.</summary>
public record class RefreshUploadsResponse
{
    [Required]
    public required PresignedUpload[] Uploads { get; set; }
}
