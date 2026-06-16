using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

public record class PresignedPut
{
    /// <summary>Time-limited, single-key PUT URL the client uploads the bytes to.</summary>
    [Required]
    public required string Url { get; set; }

    /// <summary>Headers the client must send on the PUT for the signature to match (e.g. Content-Type).</summary>
    [Required]
    public required IReadOnlyDictionary<string, string> RequiredHeaders { get; set; }

    public required DateTimeOffset ExpiresAt { get; set; }
}

public record class MediaObjectInfo
{
    /// <summary>False when the object is not present in storage (e.g. not uploaded yet).</summary>
    public required bool Exists { get; set; }

    /// <summary>Size of the stored object in bytes; 0 when <see cref="Exists"/> is false.</summary>
    public required long ContentLength { get; set; }

    public string? ContentType { get; set; }
}
