namespace Hobbyist.Common;

/// <summary>Short URL-safe slugs; 12 base-62 chars (~3.2×10²¹) is UUID-equivalent, so no retry loop.</summary>
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
