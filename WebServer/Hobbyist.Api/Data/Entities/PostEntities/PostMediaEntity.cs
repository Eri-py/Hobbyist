using System.ComponentModel.DataAnnotations.Schema;

namespace Hobbyist.Api.Data.Entities.PostEntities;

/// <summary>One media file belonging to a post. The storage object key is not stored — it is
/// derived on demand from the owning user, the post slug, <see cref="Index"/> and
/// <see cref="FileExtension"/> (see the storage service's key builder, the single source of truth).</summary>
public class PostMediaEntity
{
    public Guid Id { get; set; }

    [ForeignKey("Post")]
    public required string PostId { get; set; }

    /// <summary>1-based position within the post; also the ordinal used to build the object key.</summary>
    public required int Index { get; set; }

    /// <summary>File extension including the leading dot (e.g. ".jpg"), used to derive the object key.</summary>
    public required string FileExtension { get; set; }

    public required string ContentType { get; set; }

    /// <summary>File size in bytes. Declared in the upload manifest at init and verified against
    /// the stored object at finalize — a mismatch fails that file.</summary>
    public required long ByteSize { get; set; }

    public PostMediaStatus Status { get; set; }

    // Navigation property
    public PostEntity? Post { get; set; }
}
