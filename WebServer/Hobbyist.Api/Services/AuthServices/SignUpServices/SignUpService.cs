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
    ITokenService jwtService
) : ISignUpService
{
    private const string purpose = "signup";

    public async Task<Result<OtpResponse>> StartSignUpAsync(StartSignUpRequest request)
    {
        var username = request.Username.ToLower();
        var email = request.Email.ToLower();

        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.Username == username || u.Email == email
        );
        if (user is not null)
        {
            return Result.Conflict("Email taken");
        }

        var otpResult = await otpService.SendOtpAsync(email, username, purpose);
        return otpResult;
    }

    public Result VerifyOtp(VerifyOtpRequest request)
    {
        var email = request.Email.ToLower();
        var otp = request.Otp;

        return otpService.VerifyOtp(email, otp, purpose);
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(ResendOtpRequestSignUp request)
    {
        var email = request.Email.ToLower();
        var username = request.Username.ToLower();

        var otpResult = await otpService.SendOtpAsync(email, username, purpose);
        return otpResult;
    }

    public async Task<Result<AuthResult>> CompleteSignUpAsync(CompleteRegistrationRequest request)
    {
        var email = request.Email.ToLower();
        var username = request.Username.ToLower();
        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.Email == email && u.Username == username
        );
        if (user is null)
            return Result.NotFound("User not found");

        // Update user
        user.PasswordHash = new PasswordHasher<UserEntity>().HashPassword(user, request.Password);
        user.Firstname = request.Firstname;
        user.Lastname = request.Lastname;
        user.DateOfBirth = DateOnly.Parse(request.DateOfBirth);
        user.CreatedAt = DateTime.UtcNow;

        var refreshTokenDetails = jwtService.CreateRefreshToken(
            AuthConfig.RefreshTokenValidForDays
        );

        // Add token to database
        var refreshTokenEntry = new RefreshTokenEntity
        {
            TokenHash = jwtService.HashToken(refreshTokenDetails.Value),
            TokenExpiresAt = refreshTokenDetails.ExpiresAt,
            UserId = user.Id,
        };
        user.RefreshTokens.Add(refreshTokenEntry);

        await context.SaveChangesAsync();

        var accessTokenDetails = jwtService.CreateAccessToken(
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
}
