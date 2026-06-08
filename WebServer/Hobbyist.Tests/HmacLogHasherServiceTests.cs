using Hobbyist.Api.Services.LoggingHashServices;
using Microsoft.Extensions.Configuration;

namespace Hobbyist.Tests;

[TestFixture]
public class HmacLogHasherServiceTests
{
    [Test]
    public void Hash_WithSameNormalizedValue_IsDeterministic()
    {
        // Arrange
        var hasher = BuildHasher("test-log-key");

        // Act
        var first = hasher.Hash("  USER@Example.com  ");
        var second = hasher.Hash("user@example.com");

        // Assert
        Assert.That(first, Is.EqualTo(second));
    }

    [Test]
    public void Hash_WithDifferentValues_ReturnsDifferentHashes()
    {
        // Arrange
        var hasher = BuildHasher("test-log-key");

        // Act
        var first = hasher.Hash("user1@example.com");
        var second = hasher.Hash("user2@example.com");

        // Assert
        Assert.That(first, Is.Not.EqualTo(second));
    }

    private static HmacLogHasherService BuildHasher(string key)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["Security:LogHashKey"] = key }
            )
            .Build();

        return new HmacLogHasherService(config);
    }
}
