using System.Net;
using System.Text.Json;
using Hobbyist.Api.Extensions;
using Hobbyist.Common;

namespace Hobbyist.Api.Middleware;

public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger
)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (BadHttpRequestException ex)
        {
            logger.LogWarning(
                ex,
                "Bad request for {Method} {Path}",
                context.Request.Method,
                context.Request.Path.Value.SanitizeForLog()
            );
            await WriteErrorResponseAsync(context, ex.StatusCode, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Unhandled exception for {Method} {Path}",
                context.Request.Method,
                context.Request.Path.Value.SanitizeForLog()
            );
            await WriteErrorResponseAsync(
                context,
                (int)HttpStatusCode.InternalServerError,
                ErrorMessages.UnexpectedError
            );
        }
    }

    private static async Task WriteErrorResponseAsync(
        HttpContext context,
        int statusCode,
        string message
    )
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var body = JsonSerializer.Serialize(new { message });
        await context.Response.WriteAsync(body);
    }
}
