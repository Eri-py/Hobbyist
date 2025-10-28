using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.AuthServices.SignUpServices;

public interface ISignUpService
{
    /// <summary>
    /// Initiates the sign-up process for a new user.
    /// </summary>
    /// <param name="request">The registration request containing username and email. See <see cref="StartSignUpRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="OtpResponse"/></returns>
    public Task<Result<OtpResponse>> StartSignUpAsync(StartSignUpRequest request);

    /// <summary>
    /// Verifies the provided verification code for email confirmation.
    /// </summary>
    /// <param name="request">The verification request containing email and code. See <see cref="VerifyOtpRequest"/></param>
    /// <returns><see cref="Result"/></returns>
    public Result VerifyOtp(VerifyOtpRequest request);

    /// <summary>
    /// Resends the verification code to the specified email.
    /// </summary>
    /// <param name="request">The email address to resend the code to. See <see cref="ResendOtpRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="OtpResponse"/></returns>
    public Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request);

    /// <summary>
    /// Completes the user registration process.
    /// </summary>
    /// <param name="request">The complete registration request containing all user details. See <see cref="CompleteSignUpRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="AuthResult"/></returns>
    public Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request);
}
