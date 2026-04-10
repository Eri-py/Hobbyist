using Hobbyist.Common;

namespace Hobbyist.Tests;

[TestFixture]
public class NormalizeConnectionStringTests
{
    [Test]
    public void NormalizePostgres_WithClassicConnectionString_ReturnsInputUnchanged()
    {
        // Arrange
        const string raw =
            "Host=localhost;Port=5432;Database=hobbyist;Username=postgres;Password=Password123.;";

        // Act
        var result = NormalizeConnectionString.NormalizePostgres(raw);

        // Assert
        Assert.That(result, Is.EqualTo(raw));
    }

    [Test]
    public void NormalizePostgres_WithPostgresUri_ParsesAndNormalizes()
    {
        // Arrange
        const string raw = "postgres://user:p%40ss@db.example.com:5432/hobbyist";

        // Act
        var result = NormalizeConnectionString.NormalizePostgres(raw);

        // Assert
        Assert.That(
            result,
            Is.EqualTo(
                "Host=db.example.com;Port=5432;Database=hobbyist;Username=user;Password=p@ss;"
            )
        );
    }

    [Test]
    public void NormalizePostgres_WithInvalidUri_ThrowsInvalidOperationException()
    {
        // Arrange
        const string raw = "postgres:///hobbyist";

        // Act + Assert
        Assert.Throws<InvalidOperationException>(() =>
            NormalizeConnectionString.NormalizePostgres(raw)
        );
    }

    [Test]
    public void NormalizeRedis_WithClassicConnectionString_ReturnsInputUnchanged()
    {
        // Arrange
        const string raw = "localhost:6379";

        // Act
        var result = NormalizeConnectionString.NormalizeRedis(raw);

        // Assert
        Assert.That(result, Is.EqualTo(raw));
    }

    [Test]
    public void NormalizeRedis_WithRedisUri_ParsesAndNormalizes()
    {
        // Arrange
        const string raw = "rediss://:p%40ss@redis.example.com:6380";

        // Act
        var result = NormalizeConnectionString.NormalizeRedis(raw);

        // Assert
        Assert.That(result, Is.EqualTo("redis.example.com:6380,password=p@ss,ssl=true"));
    }

    [Test]
    public void NormalizeRedis_WithRedisUriWithoutPassword_ParsesHostPortAndSsl()
    {
        // Arrange
        const string raw = "redis://redis.example.com";

        // Act
        var result = NormalizeConnectionString.NormalizeRedis(raw);

        // Assert
        Assert.That(result, Is.EqualTo("redis.example.com:6379,ssl=false"));
    }

    [Test]
    public void NormalizeRedis_WithInvalidUri_ThrowsInvalidOperationException()
    {
        // Arrange
        const string raw = "redis://:bad@";

        // Act + Assert
        Assert.Throws<InvalidOperationException>(() =>
            NormalizeConnectionString.NormalizeRedis(raw)
        );
    }
}
