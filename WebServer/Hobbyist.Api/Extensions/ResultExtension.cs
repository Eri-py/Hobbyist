using Hobbyist.Common;
using Microsoft.AspNetCore.Mvc;

namespace Hobbyist.Api.Extensions;

/// <summary>
/// Maps application result types to appropriate ASP.NET Core action results.
/// </summary>
/// <remarks>
/// <para>This mapper converts:</para>
/// <list type="bullet">
/// <item><description><see cref="Result"/> -> <see cref="ActionResult"/></description></item>
/// <item><description><see cref="Result{T}"/> -> <see cref="ActionResult{T}"/></description></item>
/// </list>
/// <para>Mapping rules:</para>
/// <list type="bullet">
/// <item><description>Success -> 200 OK (with data for generic results)</description></item>
/// <item><description>NoContent -> 204 No Content</description></item>
/// <item><description>BadRequest -> 400 Bad Request</description></item>
/// <item><description>Unauthorized -> 401 Unauthorized</description></item>
/// <item><description>NotFound -> 404 Not Found</description></item>
/// <item><description>Conflict -> 409 Conflict</description></item>
/// <item><description>InternalServerError -> 500 Internal Server Error</description></item>
/// </list>
/// </remarks>
public static class ResultExtensions
{
    /// <summary>
    /// Maps a non-generic result to an action result.
    /// </summary>
    /// <param name="result">The operation result to map</param>
    /// <returns>An appropriate ASP.NET Core action result</returns>
    public static ActionResult ToActionResult(this Result result)
    {
        return result.ResultType switch
        {
            ResultTypes.Success => new OkResult(),
            ResultTypes.NoContent => new NoContentResult(),
            ResultTypes.BadRequest => new BadRequestObjectResult(new { message = result.Message }),
            ResultTypes.NotFound => new NotFoundObjectResult(new { message = result.Message }),
            ResultTypes.Conflict => new ConflictObjectResult(new { message = result.Message }),
            ResultTypes.Unauthorized => new UnauthorizedObjectResult(
                new { message = result.Message }
            ),
            ResultTypes.InternalServerError => new ObjectResult(new { message = result.Message })
            {
                StatusCode = 500,
            },
            ResultTypes.TooManyRequests => new ObjectResult(new { message = result.Message })
            {
                StatusCode = 429,
            },
            _ => new ObjectResult(new { message = "An unexpected error occurred" })
            {
                StatusCode = 500,
            },
        };
    }

    /// <summary>
    /// Maps a generic result to a typed action result.
    /// </summary>
    /// <typeparam name="T">The type of the result data</typeparam>
    /// <param name="result">The operation result to map</param>
    /// <returns>An appropriate typed ASP.NET Core action result</returns>
    public static ActionResult<T> ToActionResult<T>(this Result<T> result)
    {
        return result.ResultType switch
        {
            ResultTypes.Success => new OkObjectResult(result.Content),
            ResultTypes.NoContent => new NoContentResult(),
            ResultTypes.BadRequest => new BadRequestObjectResult(new { message = result.Message }),
            ResultTypes.NotFound => new NotFoundObjectResult(new { message = result.Message }),
            ResultTypes.Conflict => new ConflictObjectResult(new { message = result.Message }),
            ResultTypes.Unauthorized => new UnauthorizedObjectResult(
                new { message = result.Message }
            ),
            ResultTypes.InternalServerError => new ObjectResult(new { message = result.Message })
            {
                StatusCode = 500,
            },
            ResultTypes.TooManyRequests => new ObjectResult(new { message = result.Message })
            {
                StatusCode = 429,
            },
            _ => new ObjectResult(new { message = "An unexpected error occurred" })
            {
                StatusCode = 500,
            },
        };
    }
}
