using System;
using System.Security.Cryptography;

namespace Hobbyist.Common;

public static class CryptoRandom
{
    private static readonly ThreadLocal<RandomNumberGenerator> crng = new(
        RandomNumberGenerator.Create
    );
    private static readonly ThreadLocal<byte[]> bytes = new(() => new byte[sizeof(int)]);

    public static int NextInt()
    {
        crng.Value!.GetBytes(bytes.Value!);
        return BitConverter.ToInt32(bytes.Value!, 0) & int.MaxValue;
    }

    public static int NextInt(int maxExclusive)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maxExclusive);
        return RandomNumberGenerator.GetInt32(maxExclusive);
    }
}
