using System.Security.Claims;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.AuthServices.AuthSessionServices;

public interface IAuthSessionService
{
    /// <summary>
    /// Gets current user details from claims and validates the account still exists.
    /// </summary>
    /// <param name="user">The authenticated user claims principal</param>
    /// <param name="httpContext">The HTTP context for cookie operations</param>
    /// <param name="request">The request used for platform detection</param>
    /// <returns><see cref="GetUserResponse"/></returns>
    Task<GetUserResponse> GetUserDetailsAsync(
        ClaimsPrincipal user,
        HttpContext httpContext,
        HttpRequest request,
        CancellationToken ct
    );

    /// <summary>
    /// Verifies refresh token from cookies (web) or Authorization header (mobile).
    /// </summary>
    /// <param name="request">The request used for platform validation and token lookup</param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="AuthResult"/></returns>
    Task<Result<AuthResult>> RefreshTokenAsync(HttpRequest request, CancellationToken ct);
}
