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
    private const string purpose = "signup";

    public async Task<Result<OtpResponse>> StartSignUpAsync(StartSignUpRequest request)
    {
        var username = request.Username.ToLower();
        var email = request.Email.ToLower();

        // Check if user already exists
        if (await IsExistingUser(username, email))
        {
            return Result<OtpResponse>.Conflict("Email taken");
        }

        var otpResult = await otpService.SendOtpAsync(email, purpose);
        return otpResult;
    }

    public Result VerifyOtp(VerifyOtpRequest request)
    {
        var email = request.Email.ToLower();
        var otp = request.Otp;

        return otpService.VerifyOtp(email, otp, purpose);
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequest request)
    {
        var email = request.Email.ToLower();

        var otpResult = await otpService.SendOtpAsync(email, purpose);
        return otpResult;
    }

    public async Task<Result<AuthResult>> CompleteSignUpAsync(CompleteSignUpRequest request)
    {
        var email = request.Email.ToLower();
        var username = request.Username.ToLower();

        // Check if OTP was verified
        if (!otpService.IsVerified(email, purpose))
        {
            return Result<AuthResult>.BadRequest("Email verification required");
        }

        // Check if user already exists
        if (await IsExistingUser(username, email))
        {
            otpService.ClearVerification(email, purpose);
            return Result<AuthResult>.Conflict("Email taken");
        }

        var hasher = new PasswordHasher<UserEntity>();
        var passwordHash = hasher.HashPassword(null!, request.Password);

        using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // Create user and add to database
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

            // create refresh token and add to database
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

            // Save changes to database
            await context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Remove verification flag after successful signup
            otpService.ClearVerification(email, purpose);

            // Create access token and return all token informations
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

    private async Task<bool> IsExistingUser(string username, string email) =>
        await context.Users.AnyAsync(u => u.Username == username || u.Email == email);
}
