namespace Hobbyist.Api.Services.AuthServices.SignUpServices;

public static class SignUpConfig
{
    /// <summary>
    /// Purpose identifier for sign-up OTP operations
    /// </summary>
    public const string SignUpPurpose = "signup";

    /// <summary>
    /// Minimum age required to create an account.
    /// </summary>
    public const int MinimumAgeYears = 13;
}
