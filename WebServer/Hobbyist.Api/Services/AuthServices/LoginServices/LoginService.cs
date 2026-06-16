using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.AuthServices.LoginServices;

public class LoginService(
    HobbyistDbContext context,
    IOtpService otpService,
    ITokenService tokenService,
    ILogger<LoginService> logger
) : ILoginService
{
    public async Task<Result<StartLoginResponse>> StartLoginAsync(
        StartLoginRequest request,
        CancellationToken ct
    )
    {
        var identifier = request.Identifier.ToLower();
        var password = request.Password;

        var user = await context.Users.FirstOrDefaultAsync(
            u => u.Username == identifier || u.Email == identifier,
            ct
        );
        if (user is null)
        {
            logger.LogWarning(
                "Login attempt with unknown identifier hash '{IdentifierHash}'",
                logger.Hash(identifier)
            );
            return Result<StartLoginResponse>.NotFound(ErrorMessages.InvalidLoginCredentials);
        }

        var verifyPasswordResult = new PasswordHasher<UserEntity>().VerifyHashedPassword(
            user,
            user.PasswordHash!,
            password
        );

        if (verifyPasswordResult == PasswordVerificationResult.Failed)
        {
            logger.LogWarning(
                "Invalid password attempt for email hash '{EmailHash}'",
                logger.Hash(user.Email)
            );
            return Result<StartLoginResponse>.NotFound(ErrorMessages.InvalidLoginCredentials);
        }

        var otpResult = await otpService.SendOtpAsync(user.Email!, LoginConfig.LoginPurpose, ct);
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

    public async Task<Result<AuthResult>> CompleteLoginAsync(
        CompleteLoginRequest request,
        CancellationToken ct
    )
    {
        var identifier = request.Identifier.ToLower();
        var otp = request.Otp;

        var user = await context.Users.FirstOrDefaultAsync(
            u => u.Email == identifier || u.Username == identifier,
            ct
        );

        if (user is null)
            return Result<AuthResult>.BadRequest(ErrorMessages.InvalidOrExpiredOtp);

        var verifyResult = otpService.VerifyOtp(user.Email!, otp, LoginConfig.LoginPurpose);
        if (!verifyResult.IsSuccess)
        {
            return Result<AuthResult>.FromError(verifyResult);
        }

        // Atomic: refresh-token write + commit together.
        using var transaction = await context.Database.BeginTransactionAsync(ct);
        try
        {
            var refreshTokenDetails = tokenService.CreateRefreshToken(user.Id);
            user.RefreshTokens.Add(refreshTokenDetails.Entry);

            await context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

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
                "Transaction failed during login completion for email hash '{EmailHash}'",
                logger.Hash(user?.Email)
            );
            return Result<AuthResult>.InternalServerError(ErrorMessages.UnexpectedError);
        }
    }

    public async Task<Result<OtpResponse>> ResendOtpAsync(
        ResendOtpRequest request,
        CancellationToken ct
    )
    {
        var email = request.Email.ToLower();
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
            return Result<OtpResponse>.NotFound(ErrorMessages.UserNotFound);

        var otpResult = await otpService.SendOtpAsync(user.Email!, LoginConfig.LoginPurpose, ct);
        return otpResult;
    }
}
