namespace Hobbyist.Common;

/// <summary>Possible outcome types for operations.</summary>
public enum ResultTypes
{
    Success,
    NoContent,
    BadRequest,
    Unauthorized,
    NotFound,
    Conflict,
    InternalServerError,
    TooManyRequests,
}

/// <summary>The outcome of an operation that doesn't return data.</summary>
public record Result(string? Message, ResultTypes ResultType)
{
    public bool IsSuccess => ResultType == ResultTypes.NoContent;

    public static Result NoContent() => new(null, ResultTypes.NoContent);

    public static Result BadRequest(string message) => new(message, ResultTypes.BadRequest);

    public static Result Unauthorized(string message) => new(message, ResultTypes.Unauthorized);

    public static Result NotFound(string message) => new(message, ResultTypes.NotFound);

    public static Result Conflict(string message) => new(message, ResultTypes.Conflict);

    public static Result InternalServerError(string message) =>
        new(message, ResultTypes.InternalServerError);

    public static Result TooManyRequests(string message) =>
        new(message, ResultTypes.TooManyRequests);
}

/// <summary>The outcome of an operation that returns data.</summary>
public record Result<T>(string? Message, ResultTypes ResultType, T? Content = default)
{
    public bool IsSuccess => ResultType == ResultTypes.Success;

    public static Result<T> Success(T content) => new(null, ResultTypes.Success, content);

    public static Result<T> BadRequest(string message) => new(message, ResultTypes.BadRequest);

    public static Result<T> Unauthorized(string message) => new(message, ResultTypes.Unauthorized);

    public static Result<T> NotFound(string message) => new(message, ResultTypes.NotFound);

    public static Result<T> Conflict(string message) => new(message, ResultTypes.Conflict);

    public static Result<T> InternalServerError(string message) =>
        new(message, ResultTypes.InternalServerError);

    public static Result<T> TooManyRequests(string message) =>
        new(message, ResultTypes.TooManyRequests);

    /// <summary>Builds a typed error result from a non-generic error Result.</summary>
    /// <exception cref="InvalidOperationException">If the source result is successful.</exception>
    public static Result<T> FromError(Result errorResult)
    {
        if (errorResult.IsSuccess)
            throw new InvalidOperationException(
                "Cannot create error result from successful result"
            );

        return new Result<T>(errorResult.Message, errorResult.ResultType);
    }

    /// <summary>Builds a typed error result from an error Result of a different type.</summary>
    /// <exception cref="InvalidOperationException">If the source result is successful.</exception>
    public static Result<T> FromError<TOther>(Result<TOther> errorResult)
    {
        if (errorResult.IsSuccess)
            throw new InvalidOperationException(
                "Cannot create error result from successful result"
            );

        return new Result<T>(errorResult.Message, errorResult.ResultType);
    }
}
