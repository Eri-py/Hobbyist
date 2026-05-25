namespace Hobbyist.Common;

/// <summary>
/// Generates short, URL-safe slugs for use as public-facing identifiers.
/// 12 base-62 characters gives ~3.2 × 10²¹ possible values —
/// statistically equivalent to a UUID and safe without a retry loop.
/// </summary>
public static class SlugGenerator
{
    private const string Alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    /// <summary>Number of characters in each generated slug.</summary>
    public const int SlugLength = 12;

    /// <summary>Generates a new random slug.</summary>
    public static string Generate() =>
        string.Concat(
            Enumerable.Range(0, SlugLength)
                      .Select(_ => Alphabet[CryptoRandom.NextInt(Alphabet.Length)])
        );
}
