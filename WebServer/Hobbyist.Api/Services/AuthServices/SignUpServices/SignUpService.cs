using System.Globalization;
using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.AuthServices.SignUpServices;

public class SignUpService(
    HobbyistDbContext context,
    IOtpService otpService,
    ITokenService tokenService,
    ILogger<SignUpService> logger
) : ISignUpService
{
    public async Task<Result<OtpResponse>> StartSignUpAsync(
        StartSignUpRequest request,
        CancellationToken ct
    )
    {
        // Normalize input for consistent database queries
        var username = request.Username.ToLower();
        var email = request.Email.ToLower();

        // Check for existing user conflicts
        var (exists, errorMessage) = await CheckExistingUserAsync(username, email, ct);
        if (exists)
        {
            logger.LogWarning(
                "Sign-up conflict for username '{Username}' / email hash '{EmailHash}': {Error}",
                username.SanitizeForLog(),
                logger.Hash(email),
                errorMessage
            );
            return Result<OtpResponse>.Conflict(errorMessage);
        }

        // Send OTP for email verification
        return await otpService.SendOtpAsync(email, SignUpConfig.SignUpPurpose, ct);
    }

    public Result VerifyOtp(VerifyOtpRequest request)
    {
        // Normalize email and verify OTP
        var email = request.Email.ToLower();
        var otp = request.Otp;

        return otpService.VerifyOtp(email, otp, SignUpConfig.SignUpPurpose);
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(
        ResendOtpRequest request,
        CancellationToken ct
    )
    {
        // Normalize email and resend OTP
        var email = request.Email.ToLower();

        return await otpService.SendOtpAsync(email, SignUpConfig.SignUpPurpose, ct);
    }

    public async Task<Result<AuthResult>> CompleteSignUpAsync(
        CompleteSignUpRequest request,
        CancellationToken ct
    )
    {
        // Normalize input
        var email = request.Email.ToLower();
        var username = request.Username.ToLower();

        // Verify OTP was completed before proceeding
        if (!otpService.IsVerified(email, SignUpConfig.SignUpPurpose))
        {
            return Result<AuthResult>.BadRequest(ErrorMessages.EmailVerificationRequired);
        }

        // Final check for existing user
        var (exists, errorMessage) = await CheckExistingUserAsync(username, email, ct);
        if (exists)
        {
            otpService.ClearVerification(email, SignUpConfig.SignUpPurpose);
            return Result<AuthResult>.Conflict(errorMessage);
        }

        if (
            !TryValidateDateOfBirth(
                request.DateOfBirth,
                out var dateOfBirth,
                out var validationError
            )
        )
        {
            return Result<AuthResult>.BadRequest(validationError!);
        }

        // Hash password securely
        var hasher = new PasswordHasher<UserEntity>();
        var passwordHash = hasher.HashPassword(null!, request.Password);

        // Use transaction for atomic operation
        using var transaction = await context.Database.BeginTransactionAsync(ct);
        try
        {
            // Create user entity
            var user = new UserEntity
            {
                Username = username,
                Email = email,
                PasswordHash = passwordHash,
                Firstname = request.Firstname,
                Lastname = request.Lastname,
                DateOfBirth = dateOfBirth,
                CreatedAt = DateTimeOffset.UtcNow,
            };
            context.Users.Add(user);

            await AttachInterestsAsync(user, request.Interests, ct);

            // Generate refresh token
            var refreshTokenDetails = tokenService.CreateRefreshToken(user.Id);
            user.RefreshTokens.Add(refreshTokenDetails.Entry);

            // Save all changes to database
            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            otpService.ClearVerification(email, SignUpConfig.SignUpPurpose);

            // Generate access token for immediate use
            var accessTokenDetails = tokenService.CreateAccessToken(
                user,
                TokenConfig.AccessTokenValidForMinutes
            );

            // Return authentication tokens to client
            return Result<AuthResult>.Success(
                new AuthResult
                {
                    AccessToken = accessTokenDetails.Value,
                    RefreshToken = refreshTokenDetails.Value,
                    AccessTokenExpiresAt = accessTokenDetails.ExpiresAt,
                    RefreshTokenExpiresAt = refreshTokenDetails.ExpiresAt,
                }
            );
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            logger.LogError(
                ex,
                "Transaction failed during sign-up completion for email hash '{EmailHash}'",
                logger.Hash(email)
            );
            return Result<AuthResult>.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }

    private async Task<(bool Exists, string ErrorMessage)> CheckExistingUserAsync(
        string username,
        string email,
        CancellationToken ct
    )
    {
        var existingUser = await context.Users.FirstOrDefaultAsync(
            u => u.Username == username || u.Email == email,
            ct
        );

        if (existingUser == null)
        {
            return (false, string.Empty);
        }

        // Return specific error message for username vs email conflict
        if (existingUser.Username == username)
        {
            return (true, ErrorMessages.UsernameTaken);
        }

        return (true, ErrorMessages.EmailTaken);
    }

    private async Task AttachInterestsAsync(
        UserEntity user,
        IEnumerable<string> interests,
        CancellationToken ct
    )
    {
        var normalizedInterests = interests
            .Where(i => !string.IsNullOrWhiteSpace(i))
            .Select(i => i.Trim().ToLowerInvariant())
            .ToHashSet();

        if (normalizedInterests.Count == 0)
        {
            return;
        }

        var existingHobbies = await context
            .Hobbies.Where(h => normalizedInterests.Contains(h.Name.ToLower()))
            .ToListAsync(ct);

        foreach (var hobby in existingHobbies)
        {
            user.Hobbies.Add(hobby);
            normalizedInterests.Remove(hobby.Name.ToLower());
        }

        var newHobbies = normalizedInterests.Select(i => new HobbyEntity { Name = i }).ToList();

        if (newHobbies.Count > 0)
        {
            context.Hobbies.AddRange(newHobbies);
        }

        foreach (var hobby in newHobbies)
        {
            user.Hobbies.Add(hobby);
        }
    }

    private static bool TryValidateDateOfBirth(
        string rawDateOfBirth,
        out DateOnly dateOfBirth,
        out string? validationError
    )
    {
        if (
            !DateOnly.TryParseExact(
                rawDateOfBirth,
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out dateOfBirth
            )
        )
        {
            validationError = ErrorMessages.InvalidDateOfBirth;
            return false;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var latestAllowedDateOfBirth = today.AddYears(-SignUpConfig.MinimumAgeYears);
        if (dateOfBirth > latestAllowedDateOfBirth)
        {
            validationError = string.Format(
                CultureInfo.InvariantCulture,
                ErrorMessages.MinimumAgeRequired,
                SignUpConfig.MinimumAgeYears
            );
            return false;
        }

        validationError = null;
        return true;
    }
}
