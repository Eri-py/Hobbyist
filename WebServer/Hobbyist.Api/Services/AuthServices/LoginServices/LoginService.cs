using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
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
    private const string purpose = "login";
    private readonly string _userNotFoundMessage =
        "Your login credentials don't match an account in our system.";

    public async Task<Result<StartLoginResponse>> StartLoginAsync(StartLoginRequest request)
    {
        var identifier = request.Identifier.ToLower();
        var password = request.Password;
        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.Username == identifier || u.Email == identifier
        );
        if (user is null)
            return Result<StartLoginResponse>.NotFound(_userNotFoundMessage);

        // Verify password
        var verifyPasswordResult = new PasswordHasher<UserEntity>().VerifyHashedPassword(
            user,
            user.PasswordHash!,
            password
        );

        if (verifyPasswordResult == PasswordVerificationResult.Failed)
            return Result<StartLoginResponse>.NotFound(_userNotFoundMessage);

        // Send OTP
        var otpResult = await otpService.SendOtpAsync(user.Email!, purpose);
        if (!otpResult.IsSuccess)
        {
            return Result<StartLoginResponse>.FromError(otpResult);
        }

        var response = new StartLoginResponse
        {
            OtpExpiresAt = otpResult.Content!.OtpExpiresAt.ToString("o"),
            Email = user.Email,
        };
        return Result<StartLoginResponse>.Success(response);
    }

    public async Task<Result<AuthResult>> CompleteLoginAsync(CompleteLoginRequest request)
    {
        var identifier = request.Identifier.ToLower();
        var otp = request.Otp;

        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.Email == identifier || u.Username == identifier
        );

        if (user is null)
            return Result<AuthResult>.BadRequest("Invalid or expired verification code");

        // Verify OTP
        var verifyResult = otpService.VerifyOtp(user.Email!, otp, purpose);
        if (!verifyResult.IsSuccess)
        {
            return Result<AuthResult>.FromError(verifyResult);
        }

        using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            var refreshTokenDetails = tokenService.CreateRefreshToken(
                AuthConfig.RefreshTokenValidForDays
            );
            // Add refresh token to database
            var refreshTokenEntry = new RefreshTokenEntity
            {
                TokenHash = tokenService.HashToken(refreshTokenDetails.Value),
                TokenExpiresAt = refreshTokenDetails.ExpiresAt,
                UserId = user.Id,
            };
            user.RefreshTokens.Add(refreshTokenEntry);

            await context.SaveChangesAsync();
            await transaction.CommitAsync();

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
            await transaction.RollbackAsync();
            return Result<AuthResult>.InternalServerError("An unexpected error has occured");
        }
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request)
    {
        var email = request.Email.ToLower();

        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null)
            return Result<OtpResponse>.NotFound("User not found");

        var otpResult = await otpService.SendOtpAsync(user.Email!, purpose);
        return otpResult;
    }
}
