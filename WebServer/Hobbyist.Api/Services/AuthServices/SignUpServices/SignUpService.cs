using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.AuthServices.SignUpServices;

public class SignUpService(
    HobbyistDbContext context,
    IOtpService otpService,
    ITokenService tokenService
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
            return Result<OtpResponse>.Conflict(errorMessage);
        }

        // Send OTP for email verification
        return await otpService.SendOtpAsync(email, AuthConfig.SignUpPurpose);
    }

    public Result VerifyOtp(VerifyOtpRequest request)
    {
        // Normalize email and verify OTP
        var email = request.Email.ToLower();
        var otp = request.Otp;

        return otpService.VerifyOtp(email, otp, AuthConfig.SignUpPurpose);
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request)
    {
        // Normalize email and resend OTP
        var email = request.Email.ToLower();

        return await otpService.SendOtpAsync(email, AuthConfig.SignUpPurpose);
    }

    public async Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request)
    {
        // Normalize input
        var email = request.Email.ToLower();
        var username = request.Username.ToLower();

        // Verify OTP was completed before proceeding
        if (!otpService.IsVerified(email, AuthConfig.SignUpPurpose))
        {
            return Result<AuthResult>.BadRequest(ErrorMessages.EmailVerificationRequired);
        }

        // Final check for existing user (prevent race conditions)
        var (exists, errorMessage) = await CheckExistingUserAsync(username, email);
        if (exists)
        {
            otpService.ClearVerification(email, AuthConfig.SignUpPurpose);
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

            // Generate refresh token
            var refreshTokenDetails = tokenService.CreateRefreshToken(
                AuthConfig.RefreshTokenValidForDays
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

            // Clear OTP verification now that user is created
            otpService.ClearVerification(email, AuthConfig.SignUpPurpose);

            // Generate access token for immediate use
            var accessTokenDetails = tokenService.CreateAccessToken(
                user,
                AuthConfig.AccessTokenValidForMinutes
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
        catch (Exception)
        {
            // Rollback on any error
            await transaction.RollbackAsync();
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
