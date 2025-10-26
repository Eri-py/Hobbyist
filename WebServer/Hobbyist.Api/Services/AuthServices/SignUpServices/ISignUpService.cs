using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.AuthServices.SignUpServices;

/// <summary>
/// Provides services for handling user registration processes including
/// initial signup, OTP verification, and registration completion.
/// </summary>
public interface ISignUpService
{
    /// <summary>
    /// Initiates the registration process by validating and storing initial user information.
    /// </summary>
    /// <param name="request">The registration request containing username and email. See <see cref="StartSignUpRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="OtpResponse"/></returns>
    public Task<Result<OtpResponse>> StartSignUpAsync(StartSignUpRequest request);

    /// <summary>
    /// Verifies the One-Time Passcode (OTP) sent to the user's email during registration.
    /// </summary>
    /// <param name="request">The verification request containing email and OTP. See <see cref="VerifyOtpRequest"/></param>
    /// <returns>Result</returns>
    /// <remarks>
    /// Successful verification marks the email as confirmed in the system.
    /// </remarks>
    public Result VerifyOtp(VerifyOtpRequest request);

    /// <summary>
    /// Resends the OTP to the user's email address.
    /// </summary>
    /// <param name="request">The email address to resend the OTP to. See <see cref="ResendOtpRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="OtpResponse"/></returns>
    public Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request);

    /// <summary>
    /// Completes the registration process by saving all user details and creating an account.
    /// </summary>
    /// <param name="request">The complete registration request containing all user details. See <see cref="CompleteSignUpRequest"/></param>
    /// <returns><see cref="Result{T}"/> where T is <see cref="AuthResult"/></returns>
    /// <remarks>
    /// This final step requires all user information and creates the actual user account.
    /// </remarks>
    public Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request);
}
