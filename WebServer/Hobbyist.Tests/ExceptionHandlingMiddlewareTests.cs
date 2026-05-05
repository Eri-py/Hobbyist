using System.Text.Json;
using Hobbyist.Api.Middleware;
using Hobbyist.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace Hobbyist.Tests;

[TestFixture]
public class ExceptionHandlingMiddlewareTests
{
    [Test]
    public async Task InvokeAsync_WhenNextThrows_Returns500WithGenericMessage()
    {
        // Arrange
        static Task throwingNext(HttpContext _) => throw new InvalidOperationException("Boom");
        var middleware = new ExceptionHandlingMiddleware(
            throwingNext,
            NullLogger<ExceptionHandlingMiddleware>.Instance
        );

        var context = new DefaultHttpContext();
        var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(context.Response.StatusCode, Is.EqualTo(500));
            Assert.That(context.Response.ContentType, Is.EqualTo("application/json"));
        }

        responseBody.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(responseBody).ReadToEndAsync();
        var doc = JsonDocument.Parse(json);
        Assert.That(
            doc.RootElement.GetProperty("message").GetString(),
            Is.EqualTo(ErrorMessages.UnexpectedError)
        );
    }

    [Test]
    public async Task InvokeAsync_WhenNextThrowsBadHttpRequestException_Returns4xxWithMessage()
    {
        // Arrange
        static Task throwingNext(HttpContext _) =>
            throw new BadHttpRequestException("Invalid request body");
        var middleware = new ExceptionHandlingMiddleware(
            throwingNext,
            NullLogger<ExceptionHandlingMiddleware>.Instance
        );

        var context = new DefaultHttpContext();
        var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        using (Assert.EnterMultipleScope())
        {
            Assert.That(context.Response.StatusCode, Is.EqualTo(400));
            Assert.That(context.Response.ContentType, Is.EqualTo("application/json"));
        }

        responseBody.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(responseBody).ReadToEndAsync();
        var doc = JsonDocument.Parse(json);
        Assert.That(
            doc.RootElement.GetProperty("message").GetString(),
            Is.EqualTo("Invalid request body")
        );
    }

    [Test]
    public async Task InvokeAsync_WhenNextSucceeds_PassesThroughUnchanged()
    {
        // Arrange
        static Task successNext(HttpContext ctx)
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        }
        var middleware = new ExceptionHandlingMiddleware(
            successNext,
            NullLogger<ExceptionHandlingMiddleware>.Instance
        );

        var context = new DefaultHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert — status is unchanged, no error body written
        Assert.That(context.Response.StatusCode, Is.EqualTo(200));
    }
}
