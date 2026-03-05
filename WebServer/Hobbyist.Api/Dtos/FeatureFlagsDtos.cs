using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

/// <summary>
/// Response containing the enabled/disabled state of every feature flag.
/// </summary>
public record class FeatureFlagsResponse
{
    [Required]
    public required Dictionary<string, bool> Flags { get; set; }
}
