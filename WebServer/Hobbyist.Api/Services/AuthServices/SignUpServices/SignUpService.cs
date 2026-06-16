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
        var username = request.Username.ToLower();
        var email = request.Email.ToLower();

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

        return await otpService.SendOtpAsync(email, SignUpConfig.SignUpPurpose, ct);
    }

    public Result VerifyOtp(VerifyOtpRequest request)
    {
        var email = request.Email.ToLower();
        var otp = request.Otp;

        return otpService.VerifyOtp(email, otp, SignUpConfig.SignUpPurpose);
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(
        ResendOtpRequest request,
        CancellationToken ct
    )
    {
        var email = request.Email.ToLower();

        return await otpService.SendOtpAsync(email, SignUpConfig.SignUpPurpose, ct);
    }

    public async Task<Result<AuthResult>> CompleteSignUpAsync(
        CompleteSignUpRequest request,
        CancellationToken ct
    )
    {
        var email = request.Email.ToLower();
        var username = request.Username.ToLower();

        if (!otpService.IsVerified(email, SignUpConfig.SignUpPurpose))
        {
            return Result<AuthResult>.BadRequest(ErrorMessages.EmailVerificationRequired);
        }

        // Re-check: another sign-up may have claimed the username/email since StartSignUp.
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

        var hasher = new PasswordHasher<UserEntity>();
        var passwordHash = hasher.HashPassword(null!, request.Password);

        // Atomic: user + interests + refresh token persisted together.
        using var transaction = await context.Database.BeginTransactionAsync(ct);
        try
        {
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

            var refreshTokenDetails = tokenService.CreateRefreshToken(user.Id);
            user.RefreshTokens.Add(refreshTokenDetails.Entry);

            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            otpService.ClearVerification(email, SignUpConfig.SignUpPurpose);

            var accessTokenDetails = tokenService.CreateAccessToken(
                user,
                TokenConfig.AccessTokenValidForMinutes
            );

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
