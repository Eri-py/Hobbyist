using Hobbyist.Api.Extensions;
using Microsoft.AspNetCore.Http;

namespace Hobbyist.Tests;

[TestFixture]
public class HttpExtensionsTests
{
    [Test]
    public void GetPlatform_WithValidPlatform_ReturnsNormalizedValue()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Headers["Platform"] = "  Mobile  ";

        // Act
        var platform = context.Request.GetPlatform();

        // Assert
        Assert.That(platform, Is.EqualTo("mobile"));
    }

    [Test]
    public void GetPlatform_WhenMissing_ThrowsBadHttpRequestException()
    {
        // Arrange
        var context = new DefaultHttpContext();

        // Act + Assert
        var ex = Assert.Throws<BadHttpRequestException>(() => context.Request.GetPlatform());
        Assert.That(ex!.Message, Is.EqualTo("Platform header is required"));
    }

    [Test]
    public void GetPlatform_WhenInvalid_ThrowsBadHttpRequestException()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Headers["Platform"] = "desktop";

        // Act + Assert
        var ex = Assert.Throws<BadHttpRequestException>(() => context.Request.GetPlatform());
        Assert.That(ex!.Message, Is.EqualTo("Platform header must be either 'mobile' or 'web'"));
    }
}
