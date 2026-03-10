using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.Auth.LoginServices;

public interface ILoginService
{
    /// <summary>
    /// Initiates the login process by validating credentials and sending OTP for verification.
    /// </summary>
    /// <param name="request">The login request containing user identifier and password. See <see cref="StartLoginRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="StartLoginResponse"/></returns>
    public Task<Result<StartLoginResponse>> StartLoginAsync(StartLoginRequest request);

    /// <summary>
    /// Completes the login process after OTP verification and returns authentication tokens.
    /// </summary>
    /// <param name="request">The completion request containing identifier and OTP. See <see cref="CompleteLoginRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="AuthResult"/></returns>
    public Task<Result<AuthResult>> CompleteLoginAsync(CompleteLoginRequest request);

    /// <summary>
    /// Resends OTP to the user's email for login verification.
    /// </summary>
    /// <param name="request">The request containing user's email address. See <see cref="ResendOtpRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="OtpResponse"/></returns>
    public Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request);
}
