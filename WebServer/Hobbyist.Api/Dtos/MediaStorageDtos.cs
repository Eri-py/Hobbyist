using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

public record class UploadMediaRequest
{
    [Required]
    public required Stream Content { get; set; }

    [Required]
    public required string ObjectKey { get; set; }

    [Required]
    public required string FileName { get; set; }

    [Required]
    public required string ContentType { get; set; }

    public required long ContentLength { get; set; }
}

public record class UploadMediaResponse
{
    [Required]
    public required string ObjectKey { get; set; }

    [Required]
    public required string ContentType { get; set; }

    public required long SizeBytes { get; set; }
}
