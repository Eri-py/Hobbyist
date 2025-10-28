using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos.AuthDtos;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.AuthServices.LoginServices;

public class LoginService(
    HobbyistDbContext context,
    IOtpService otpService,
    ITokenService tokenService
) : ILoginService
{
    public async Task<Result<StartLoginResponse>> StartLoginAsync(StartLoginRequest request)
    {
        // Normalize identifier for case-insensitive lookup
        var identifier = request.Identifier.ToLower();
        var password = request.Password;

        // Find user by username or email
        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.Username == identifier || u.Email == identifier
        );
        if (user is null)
            return Result<StartLoginResponse>.NotFound(ErrorMessages.InvalidLoginCredentials);

        // Verify password against stored hash
        var verifyPasswordResult = new PasswordHasher<UserEntity>().VerifyHashedPassword(
            user,
            user.PasswordHash!,
            password
        );

        if (verifyPasswordResult == PasswordVerificationResult.Failed)
            return Result<StartLoginResponse>.NotFound(ErrorMessages.InvalidLoginCredentials);

        // Send OTP for email verification
        var otpResult = await otpService.SendOtpAsync(user.Email!, AuthConfig.LoginPurpose);
        if (!otpResult.IsSuccess)
        {
            return Result<StartLoginResponse>.FromError(otpResult);
        }

        // Return success with OTP expiration and user email
        var response = new StartLoginResponse
        {
            OtpExpiresAt = otpResult.Content!.OtpExpiresAt.ToString("o"),
            Email = user.Email,
        };
        return Result<StartLoginResponse>.Success(response);
    }

    public async Task<Result<AuthResult>> CompleteLoginAsync(CompleteLoginRequest request)
    {
        // Normalize identifier and get OTP
        var identifier = request.Identifier.ToLower();
        var otp = request.Otp;

        // Find user by username or email
        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.Email == identifier || u.Username == identifier
        );

        if (user is null)
            return Result<AuthResult>.BadRequest(ErrorMessages.InvalidOrExpiredOtp);

        // Verify OTP against stored verification
        var verifyResult = otpService.VerifyOtp(user.Email!, otp, AuthConfig.LoginPurpose);
        if (!verifyResult.IsSuccess)
        {
            return Result<AuthResult>.FromError(verifyResult);
        }

        // Use transaction for atomic token creation
        using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // Create refresh token and store in database
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

            // Save changes and commit transaction
            await context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Create access token and return authentication result
            var accessTokenDetails = tokenService.CreateAccessToken(
                user,
                AuthConfig.AccessTokenValidForMinutes
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
        catch (Exception)
        {
            // Rollback transaction on error
            await transaction.RollbackAsync();
            return Result<AuthResult>.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request)
    {
        // Normalize email and find user
        var email = request.Email.ToLower();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null)
            return Result<OtpResponse>.NotFound(ErrorMessages.UserNotFound);

        // Resend OTP to user's email
        var otpResult = await otpService.SendOtpAsync(user.Email!, AuthConfig.LoginPurpose);
        return otpResult;
    }
}
