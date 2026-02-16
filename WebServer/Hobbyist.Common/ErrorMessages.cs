namespace Hobbyist.Common;

/// <summary>
/// Centralized error messages used throughout the application.
/// Provides consistency in error messaging across services and tests.
/// </summary>
public static class ErrorMessages
{
    #region Authentication Errors

    /// <summary>
    /// Message shown when user login credentials don't match any account.
    /// </summary>
    public const string InvalidLoginCredentials =
        "Your login credentials don't match an account in our system.";

    /// <summary>
    /// Message shown when email verification is required before completing an action.
    /// </summary>
    public const string EmailVerificationRequired = "Email verification required";

    /// <summary>
    /// Message shown when an OTP is invalid or has expired.
    /// </summary>
    public const string InvalidOrExpiredOtp = "Invalid or expired verification code";

    /// <summary>
    /// Message shown when a refresh token is invalid or expired.
    /// </summary>
    public const string InvalidRefreshToken = "Invalid or expired refresh token";

    #endregion

    #region Conflict Errors

    /// <summary>
    /// Message shown when attempting to register with an email that's already taken.
    /// </summary>
    public const string EmailTaken = "Email taken";

    /// <summary>
    /// Message shown when attempting to register with a username that's already taken.
    /// </summary>
    public const string UsernameTaken = "Username taken";

    #endregion

    #region Not Found Errors

    /// <summary>
    /// Message shown when a user is not found in the system.
    /// </summary>
    public const string UserNotFound = "User not found";

    #endregion

    #region Platform Validation Errors

    /// <summary>
    /// Message shown when a mobile-only endpoint is accessed from a non-mobile platform.
    /// </summary>
    public const string MobileOnlyEndpoint = "This endpoint is for mobile clients only";

    /// <summary>
    /// Message shown when a web-only endpoint is accessed from a non-web platform.
    /// </summary>
    public const string WebOnlyEndpoint = "This endpoint is for web clients only";

    #endregion

    #region General Errors

    /// <summary>
    /// Generic message for unexpected server errors.
    /// </summary>
    public const string UnexpectedError = "An unexpected error has occured";

    #endregion
}
