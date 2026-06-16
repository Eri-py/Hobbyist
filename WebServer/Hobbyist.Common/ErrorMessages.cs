namespace Hobbyist.Common;

/// <summary>Centralized error messages, for consistency across services and tests.</summary>
public static class ErrorMessages
{
    #region Authentication Errors

    public const string InvalidLoginCredentials =
        "Your login credentials don't match an account in our system.";

    public const string EmailVerificationRequired = "Email verification required";

    public const string InvalidDateOfBirth = "Invalid date of birth. Use format yyyy-MM-dd.";

    public const string MinimumAgeRequired = "You must be at least {0} years old to sign up.";

    public const string InvalidOrExpiredOtp = "Invalid or expired verification code";

    public const string InvalidRefreshToken = "Invalid or expired refresh token";

    public const string TooManyOtpRequests =
        "Too many verification code requests. Please wait before trying again.";

    public const string TooManyOtpVerificationAttempts =
        "Too many incorrect verification attempts. Please try again later.";

    #endregion

    #region Conflict Errors

    public const string EmailTaken = "Email taken";

    public const string UsernameTaken = "Username taken";

    #endregion

    #region Not Found Errors

    public const string UserNotFound = "User not found";

    #endregion

    #region Platform Validation Errors

    public const string MobileOnlyEndpoint = "This endpoint is for mobile clients only";

    public const string WebOnlyEndpoint = "This endpoint is for web clients only";

    #endregion

    #region General Errors

    public const string UnexpectedError = "An unexpected error has occured";

    #endregion
}
