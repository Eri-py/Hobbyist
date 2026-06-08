using System.ComponentModel.DataAnnotations.Schema;

namespace Hobbyist.Api.Data.Entities.PostEntities;

/// <summary>One media file belonging to a post. The storage object key is not stored — it is
/// derived on demand from the owning user, the post slug, this media's stable <see cref="Id"/> and
/// <see cref="FileExtension"/> (see <c>MediaObjectKeys</c>, the single source of truth).</summary>
public class PostMediaEntity
{
    /// <summary>Stable identity. Used to build the object key, so display order can change
    /// (reorder/edit) without renaming anything in storage.</summary>
    public Guid Id { get; set; }

    [ForeignKey("Post")]
    public required string PostId { get; set; }

    /// <summary>Display order within the post; mutable and not part of the object key.</summary>
    public required int Position { get; set; }

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
