namespace Hobbyist.Common;

/// <summary>
/// Defines the possible outcome types for operations.
/// </summary>
public enum ResultTypes
{
    /// <summary>Operation succeeded and returned data (used with generic Result{T})</summary>
    Success,

    /// <summary>Operation succeeded but has no data to return (used with non-generic Result)</summary>
    NoContent,

    /// <summary>Operation failed due to invalid request parameters</summary>
    BadRequest,

    /// <summary>Operation failed because authentication is required</summary>
    Unauthorized,

    /// <summary>Operation failed because the requested resource wasn't found</summary>
    NotFound,

    /// <summary>Operation failed due to a resource conflict (e.g., duplicate entry)</summary>
    Conflict,

    /// <summary>Operation failed due to an unexpected server error</summary>
    InternalServerError,
}

/// <summary>
/// Represents the outcome of an operation that doesn't return data.
/// </summary>
/// <remarks>
/// <para>Usage patterns:</para>
/// <list type="bullet">
/// <item><description>Use <see cref="NoContent"/> for successful operations that don't return data</description></item>
/// <item><description>Use the appropriate error factory method (BadRequest, NotFound, etc.) for failures</description></item>
/// <item><description>Check <see cref="IsSuccess"/> to determine if operation succeeded</description></item>
/// </list>
/// </remarks>
public record Result(string? Message, ResultTypes ResultType)
{
    /// <summary>Indicates whether the operation succeeded</summary>
    public bool IsSuccess => ResultType == ResultTypes.NoContent;

    /// <summary>Creates a successful result for operations with no return data</summary>
    public static Result NoContent() => new(null, ResultTypes.NoContent);

    /// <summary>Creates a result indicating invalid request parameters</summary>
    public static Result BadRequest(string message) => new(message, ResultTypes.BadRequest);

    /// <summary>Creates a result indicating authentication is required</summary>
    public static Result Unauthorized(string message) => new(message, ResultTypes.Unauthorized);

    /// <summary>Creates a result indicating a resource wasn't found</summary>
    public static Result NotFound(string message) => new(message, ResultTypes.NotFound);

    /// <summary>Creates a result indicating a resource conflict</summary>
    public static Result Conflict(string message) => new(message, ResultTypes.Conflict);

    /// <summary>Creates a result indicating an unexpected server error</summary>
    public static Result InternalServerError(string message) =>
        new(message, ResultTypes.InternalServerError);
}

/// <summary>
/// Represents the outcome of an operation that returns data.
/// </summary>
/// <typeparam name="T">The type of data returned on success</typeparam>
/// <remarks>
/// <para>Usage patterns:</para>
/// <list type="bullet">
/// <item><description>Use <see cref="Success(T)"/> for successful operations that return data</description></item>
/// <item><description>Implicitly convert from non-generic <see cref="Result"/> for error cases</description></item>
/// <item><description>Check <see cref="IsSuccess"/> to determine if operation succeeded</description></item>
/// </list>
/// </remarks>
public record Result<T>(string? Message, ResultTypes ResultType, T? Content = default)
{
    /// <summary>Indicates whether the operation succeeded</summary>
    public bool IsSuccess => ResultType == ResultTypes.Success;

    /// <summary>Creates a successful result with data</summary>
    public static Result<T> Success(T content) => new(null, ResultTypes.Success, content);

    /// <summary>Creates a result indicating invalid request parameters</summary>
    public static Result<T> BadRequest(string message) => new(message, ResultTypes.BadRequest);

    /// <summary>Creates a result indicating authentication is required</summary>
    public static Result<T> Unauthorized(string message) => new(message, ResultTypes.Unauthorized);

    /// <summary>Creates a result indicating a resource wasn't found</summary>
    public static Result<T> NotFound(string message) => new(message, ResultTypes.NotFound);

    /// <summary>Creates a result indicating a resource conflict</summary>
    public static Result<T> Conflict(string message) => new(message, ResultTypes.Conflict);

    /// <summary>Creates a result indicating an unexpected server error</summary>
    public static Result<T> InternalServerError(string message) =>
        new(message, ResultTypes.InternalServerError);

    /// <summary>
    /// Creates an error result from a non-generic error Result.
    /// </summary>
    /// <param name="errorResult">The error result to convert from</param>
    /// <exception cref="InvalidOperationException">
    /// Thrown if attempting to convert from a successful result
    /// </exception>
    public static Result<T> FromError(Result errorResult)
    {
        if (errorResult.IsSuccess)
            throw new InvalidOperationException(
                "Cannot create error result from successful result"
            );

        return new Result<T>(errorResult.Message, errorResult.ResultType);
    }

    /// <summary>
    /// Creates an error result from a generic error Result of a different type.
    /// </summary>
    /// <typeparam name="TOther">The type of the source result</typeparam>
    /// <param name="errorResult">The error result to convert from</param>
    /// <exception cref="InvalidOperationException">
    /// Thrown if attempting to convert from a successful result
    /// </exception>
    public static Result<T> FromError<TOther>(Result<TOther> errorResult)
    {
        if (errorResult.IsSuccess)
            throw new InvalidOperationException(
                "Cannot create error result from successful result"
            );

        return new Result<T>(errorResult.Message, errorResult.ResultType);
    }
}
