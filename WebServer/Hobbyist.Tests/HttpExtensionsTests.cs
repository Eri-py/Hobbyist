using Hobbyist.Api.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Hobbyist.Tests;

[TestFixture]
public class HttpExtensionsTests
{
    private const string WebOrigin = "https://web.example.com";

    private static DefaultHttpContext BuildContext(string? origin = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["ClientOrigin:Address"] = WebOrigin }
            )
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddLogging();

        var ctx = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() };
        if (origin != null)
            ctx.Request.Headers.Origin = origin;

        return ctx;
    }

    [Test]
    public void GetPlatform_WithMatchingOrigin_ReturnsWeb()
    {
        var context = BuildContext(WebOrigin);
        Assert.That(context.Request.GetPlatform(), Is.EqualTo("web"));
    }

    [Test]
    public void GetPlatform_WithNoOrigin_ReturnsMobile()
    {
        var context = BuildContext();
        Assert.That(context.Request.GetPlatform(), Is.EqualTo("mobile"));
    }

    [Test]
    public void GetPlatform_WithNonMatchingOrigin_ThrowsBadHttpRequestException()
    {
        var context = BuildContext("https://other.example.com");
        Assert.Throws<BadHttpRequestException>(() => context.Request.GetPlatform());
    }
}
