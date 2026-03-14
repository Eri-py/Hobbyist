using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.Auth.OtpServices;
using Hobbyist.Api.Services.Auth.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.Auth.SignUpServices;

public class SignUpService(
    HobbyistDbContext context,
    IOtpService otpService,
    ITokenService tokenService,
    ILogger<SignUpService> logger
) : ISignUpService
{
    public async Task<Result<OtpResponse>> StartSignUpAsync(StartSignUpRequest request)
    {
        // Normalize input for consistent database queries
        var username = request.Username.ToLower();
        var email = request.Email.ToLower();

        // Check for existing user conflicts
        var (exists, errorMessage) = await CheckExistingUserAsync(username, email);
        if (exists)
        {
            logger.LogWarning(
                "Sign-up conflict for username '{Username}' / email '{Email}': {Error}",
                username,
                email,
                errorMessage
            );
            return Result<OtpResponse>.Conflict(errorMessage);
        }

        // Send OTP for email verification
        return await otpService.SendOtpAsync(email, SignUpConfig.SignUpPurpose);
    }

    public Result VerifyOtp(VerifyOtpRequest request)
    {
        // Normalize email and verify OTP
        var email = request.Email.ToLower();
        var otp = request.Otp;

        return otpService.VerifyOtp(email, otp, SignUpConfig.SignUpPurpose);
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request)
    {
        // Normalize email and resend OTP
        var email = request.Email.ToLower();

        return await otpService.SendOtpAsync(email, SignUpConfig.SignUpPurpose);
    }

    public async Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request)
    {
        // Normalize input
        var email = request.Email.ToLower();
        var username = request.Username.ToLower();
        var normalizedInterests = request
            .Interests.Where(i => !string.IsNullOrWhiteSpace(i))
            .Select(i => i.Trim().ToLowerInvariant())
            .ToHashSet();

        // Verify OTP was completed before proceeding
        if (!otpService.IsVerified(email, SignUpConfig.SignUpPurpose))
        {
            return Result<AuthResult>.BadRequest(ErrorMessages.EmailVerificationRequired);
        }

        // Final check for existing user
        var (exists, errorMessage) = await CheckExistingUserAsync(username, email);
        if (exists)
        {
            otpService.ClearVerification(email, SignUpConfig.SignUpPurpose);
            return Result<AuthResult>.Conflict(errorMessage);
        }

        // Hash password securely
        var hasher = new PasswordHasher<UserEntity>();
        var passwordHash = hasher.HashPassword(null!, request.Password);

        // Use transaction for atomic operation
        using var transaction = await context.Database.BeginTransactionAsync();
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
                DateOfBirth = DateOnly.Parse(request.DateOfBirth),
                CreatedAt = DateTime.UtcNow,
            };
            context.Users.Add(user);

            var existingHobbies = await context
                .Hobbies.Where(h => normalizedInterests.Contains(h.Name.ToLower()))
                .ToListAsync();

            // Link user to hobbies that already exist in the database.
            foreach (var hobby in existingHobbies)
            {
                user.Hobbies.Add(hobby);

                normalizedInterests.Remove(hobby.Name.ToLower());
            }

            // Create hobby rows for any interests that do not exist yet.
            var newHobbies = normalizedInterests.Select(i => new HobbyEntity { Name = i }).ToList();

            if (newHobbies.Count > 0)
            {
                context.Hobbies.AddRange(newHobbies);
            }

            // Link user to the newly created hobbies as part of the same transaction.
            foreach (var hobby in newHobbies)
            {
                user.Hobbies.Add(hobby);
            }

            // Generate refresh token
            var refreshTokenDetails = tokenService.CreateRefreshToken(
                TokenConfig.RefreshTokenValidForDays
            );
            var refreshTokenEntry = new RefreshTokenEntity
            {
                TokenHash = tokenService.HashToken(refreshTokenDetails.Value),
                TokenExpiresAt = refreshTokenDetails.ExpiresAt,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
            };
            user.RefreshTokens.Add(refreshTokenEntry);

            // Save all changes to database
            await context.SaveChangesAsync();
            await transaction.CommitAsync();

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
            await transaction.RollbackAsync();
            logger.LogError(ex, "Transaction failed during sign-up completion for {Email}", email);
            return Result<AuthResult>.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }

    private async Task<(bool Exists, string ErrorMessage)> CheckExistingUserAsync(
        string username,
        string email
    )
    {
        var existingUser = await context.Users.FirstOrDefaultAsync(u =>
            u.Username == username || u.Email == email
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
}
