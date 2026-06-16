using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos.Auth;
using Hobbyist.Api.Extensions;
using Hobbyist.Api.Services.AuthServices.OtpServices;
using Hobbyist.Api.Services.AuthServices.SignUpServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Api.Services.LoggingHashServices;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

[TestFixture]
public class SignUpServiceTests : DatabaseTestBase
{
    private SignUpService _signUpService = null!;
    private Mock<IOtpService> _otpServiceMock = null!;
    private Mock<ITokenService> _tokenServiceMock = null!;
    private Mock<ILogHasherService> _logHasherMock = null!;

    protected override Task OnSetUpAsync()
    {
        _otpServiceMock = new Mock<IOtpService>();
        _tokenServiceMock = new Mock<ITokenService>();
        _logHasherMock = new Mock<ILogHasherService>();
        _logHasherMock.Setup(x => x.Hash(It.IsAny<string?>())).Returns("hashed");
        LoggerExtensions.ConfigureHasher(_logHasherMock.Object);

        _signUpService = new SignUpService(
            Context,
            _otpServiceMock.Object,
            _tokenServiceMock.Object,
            NullLogger<SignUpService>.Instance
        );

        return Task.CompletedTask;
    }

    private static RefreshTokenDetails BuildRefreshTokenDetails(Guid userId, string tokenValue)
    {
        var expiresAt = DateTime.UtcNow.AddDays(TokenConfig.RefreshTokenValidForDays);

        return new RefreshTokenDetails
        {
            Value = tokenValue,
            ExpiresAt = expiresAt,
            Entry = new RefreshTokenEntity
            {
                TokenHash = $"hash_{tokenValue}",
                TokenExpiresAt = expiresAt,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
            },
        };
    }

    #region StartSignUpAsync

    [Test]
    public async Task StartSignUpAsync_WithNewUser_ReturnsSuccess()
    {
        var request = new StartSignUpRequest { Username = "newuser", Email = "new@example.com" };

        _otpServiceMock
            .Setup(x =>
                x.SendOtpAsync(
                    "new@example.com",
                    SignUpConfig.SignUpPurpose,
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(
                Result<OtpResponse>.Success(
                    new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(5) }
                )
            );

        var result = await _signUpService.StartSignUpAsync(request, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
    }

    [Test]
    public async Task StartSignUpAsync_WithExistingEmail_ReturnsConflict()
    {
        Context.Users.Add(
            new UserEntity
            {
                Id = Guid.NewGuid(),
                Username = "existing",
                Email = "existing@example.com",
                PasswordHash = "hash",
                Firstname = "First",
                Lastname = "Last",
                DateOfBirth = new DateOnly(1990, 1, 1),
                CreatedAt = DateTime.UtcNow,
            }
        );
        await Context.SaveChangesAsync();

        var request = new StartSignUpRequest
        {
            Username = "newuser",
            Email = "existing@example.com",
        };

        var result = await _signUpService.StartSignUpAsync(request, CancellationToken.None);

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
        Assert.That(result.Message, Is.EqualTo(ErrorMessages.EmailTaken));
    }

    [Test]
    public async Task StartSignUpAsync_WithExistingUsername_ReturnsConflict()
    {
        Context.Users.Add(
            new UserEntity
            {
                Id = Guid.NewGuid(),
                Username = "existing",
                Email = "existing@example.com",
                PasswordHash = "hash",
                Firstname = "First",
                Lastname = "Last",
                DateOfBirth = new DateOnly(1990, 1, 1),
                CreatedAt = DateTime.UtcNow,
            }
        );
        await Context.SaveChangesAsync();

        var request = new StartSignUpRequest { Username = "existing", Email = "new@example.com" };

        var result = await _signUpService.StartSignUpAsync(request, CancellationToken.None);

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
        Assert.That(result.Message, Is.EqualTo(ErrorMessages.UsernameTaken));
    }

    [Test]
    public async Task StartSignUpAsync_NormalizesEmail_WhenSendingOtp()
    {
        var request = new StartSignUpRequest
        {
            Username = "newuser",
            Email = "MixedCase@Example.COM",
        };

        _otpServiceMock
            .Setup(x =>
                x.SendOtpAsync(
                    "mixedcase@example.com",
                    SignUpConfig.SignUpPurpose,
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(
                Result<OtpResponse>.Success(
                    new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(5) }
                )
            );

        var result = await _signUpService.StartSignUpAsync(request, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        _otpServiceMock.Verify(
            x =>
                x.SendOtpAsync(
                    "mixedcase@example.com",
                    SignUpConfig.SignUpPurpose,
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    #endregion

    #region VerifyOtp

    [Test]
    public void VerifyOtp_WithValidOtp_ReturnsNoContent()
    {
        var request = new VerifyOtpRequest { Email = "test@example.com", Otp = "123456" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp("test@example.com", "123456", SignUpConfig.SignUpPurpose))
            .Returns(Result.NoContent());

        var result = _signUpService.VerifyOtp(request);

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.NoContent));
    }

    [Test]
    public void VerifyOtp_NormalizesEmail_BeforeOtpCheck()
    {
        var request = new VerifyOtpRequest { Email = "MixedCase@Example.COM", Otp = "123456" };

        _otpServiceMock
            .Setup(x => x.VerifyOtp("mixedcase@example.com", "123456", SignUpConfig.SignUpPurpose))
            .Returns(Result.NoContent());

        _ = _signUpService.VerifyOtp(request);

        _otpServiceMock.Verify(
            x => x.VerifyOtp("mixedcase@example.com", "123456", SignUpConfig.SignUpPurpose),
            Times.Once
        );
    }

    #endregion

    #region ResendOtpAsync

    [Test]
    public async Task ResendOtpAsync_WithValidEmail_ReturnsSuccess()
    {
        var request = new ResendOtpRequest { Email = "test@example.com" };

        _otpServiceMock
            .Setup(x =>
                x.SendOtpAsync(
                    "test@example.com",
                    SignUpConfig.SignUpPurpose,
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(
                Result<OtpResponse>.Success(
                    new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(5) }
                )
            );

        var result = await _signUpService.ResendOtpAsync(request, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
    }

    [Test]
    public async Task ResendOtpAsync_NormalizesEmail_BeforeSend()
    {
        var request = new ResendOtpRequest { Email = "MixedCase@Example.COM" };

        _otpServiceMock
            .Setup(x =>
                x.SendOtpAsync(
                    "mixedcase@example.com",
                    SignUpConfig.SignUpPurpose,
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(
                Result<OtpResponse>.Success(
                    new OtpResponse { OtpExpiresAt = DateTime.UtcNow.AddMinutes(5) }
                )
            );

        var result = await _signUpService.ResendOtpAsync(request, CancellationToken.None);

        Assert.That(result.IsSuccess, Is.True);
        _otpServiceMock.Verify(
            x =>
                x.SendOtpAsync(
                    "mixedcase@example.com",
                    SignUpConfig.SignUpPurpose,
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    #endregion

    #region CompleteSignUpAsync

    [Test]
    public async Task CompleteSignUpAsync_WithoutOtpVerification_ReturnsBadRequest()
    {
        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "new@example.com",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = "1990-01-01",
            Interests = ["Coins"],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("new@example.com", SignUpConfig.SignUpPurpose))
            .Returns(false);

        var result = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
        Assert.That(result.Message, Is.EqualTo(ErrorMessages.EmailVerificationRequired));
    }

    [Test]
    public async Task CompleteSignUpAsync_WithExistingUser_ReturnsConflictAndClearsVerification()
    {
        Context.Users.Add(
            new UserEntity
            {
                Id = Guid.NewGuid(),
                Username = "existing",
                Email = "existing@example.com",
                PasswordHash = "hash",
                Firstname = "First",
                Lastname = "Last",
                DateOfBirth = new DateOnly(1990, 1, 1),
                CreatedAt = DateTime.UtcNow,
            }
        );
        await Context.SaveChangesAsync();

        var request = new CompleteSignUpRequest
        {
            Username = "existing",
            Email = "existing@example.com",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = "1990-01-01",
            Interests = ["Coins"],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("existing@example.com", SignUpConfig.SignUpPurpose))
            .Returns(true);

        var result = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        Assert.That(result.ResultType, Is.EqualTo(ResultTypes.Conflict));
        _otpServiceMock.Verify(
            x => x.ClearVerification("existing@example.com", SignUpConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public async Task CompleteSignUpAsync_WithVerifiedOtp_CreatesUserAndReturnsAuthTokens()
    {
        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "new@example.com",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = "1990-01-01",
            Interests = ["Coins"],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("new@example.com", SignUpConfig.SignUpPurpose))
            .Returns(true);

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<Guid>()))
            .Returns((Guid id) => BuildRefreshTokenDetails(id, "refresh-token"));

        _tokenServiceMock
            .Setup(x =>
                x.CreateAccessToken(It.IsAny<UserEntity>(), TokenConfig.AccessTokenValidForMinutes)
            )
            .Returns(
                new AccessTokenDetails
                {
                    Value = "access-token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TokenConfig.AccessTokenValidForMinutes),
                }
            );

        var result = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content, Is.Not.Null);
            Assert.That(result.Content!.AccessToken, Is.EqualTo("access-token"));
            Assert.That(result.Content.RefreshToken, Is.EqualTo("refresh-token"));
        }

        var createdUser = await Context.Users.FirstOrDefaultAsync(x =>
            x.Email == "new@example.com"
        );
        Assert.That(createdUser, Is.Not.Null);
        _otpServiceMock.Verify(
            x => x.ClearVerification("new@example.com", SignUpConfig.SignUpPurpose),
            Times.Once
        );
    }

    [Test]
    public async Task CompleteSignUpAsync_WithInvalidDateOfBirth_ReturnsBadRequest()
    {
        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "new@example.com",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = "01/31/1990",
            Interests = ["Coins"],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("new@example.com", SignUpConfig.SignUpPurpose))
            .Returns(true);

        var result = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(result.Message, Is.EqualTo(ErrorMessages.InvalidDateOfBirth));
        }

        var createdUser = await Context.Users.FirstOrDefaultAsync(x =>
            x.Email == "new@example.com"
        );
        Assert.That(createdUser, Is.Null);
        _otpServiceMock.Verify(
            x => x.ClearVerification("new@example.com", SignUpConfig.SignUpPurpose),
            Times.Never
        );
    }

    [Test]
    public async Task CompleteSignUpAsync_WithUnderageDateOfBirth_ReturnsBadRequest()
    {
        var underageDate = DateOnly
            .FromDateTime(DateTime.UtcNow)
            .AddYears(-(SignUpConfig.MinimumAgeYears - 1))
            .ToString("yyyy-MM-dd");

        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "new@example.com",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = underageDate,
            Interests = ["Coins"],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("new@example.com", SignUpConfig.SignUpPurpose))
            .Returns(true);

        var result = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.ResultType, Is.EqualTo(ResultTypes.BadRequest));
            Assert.That(
                result.Message,
                Is.EqualTo(
                    string.Format(ErrorMessages.MinimumAgeRequired, SignUpConfig.MinimumAgeYears)
                )
            );
        }

        var createdUser = await Context.Users.FirstOrDefaultAsync(x =>
            x.Email == "new@example.com"
        );
        Assert.That(createdUser, Is.Null);
        _otpServiceMock.Verify(
            x => x.ClearVerification("new@example.com", SignUpConfig.SignUpPurpose),
            Times.Never
        );
    }

    [Test]
    public async Task CompleteSignUpAsync_WithVerifiedOtp_StoresRefreshTokenEntry()
    {
        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "new@example.com",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = "1990-01-01",
            Interests = ["Coins"],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("new@example.com", SignUpConfig.SignUpPurpose))
            .Returns(true);

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<Guid>()))
            .Returns((Guid id) => BuildRefreshTokenDetails(id, "refresh-token"));

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new AccessTokenDetails
                {
                    Value = "access-token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TokenConfig.AccessTokenValidForMinutes),
                }
            );

        _ = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        var storedRefreshToken = await Context.RefreshTokens.AnyAsync();
        Assert.That(storedRefreshToken, Is.True);
    }

    [Test]
    public async Task CompleteSignUpAsync_NormalizesUserIdentityValues()
    {
        var request = new CompleteSignUpRequest
        {
            Username = "MixedUser",
            Email = "MixedCase@Example.COM",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = "1990-01-01",
            Interests = ["Coins"],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("mixedcase@example.com", SignUpConfig.SignUpPurpose))
            .Returns(true);

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<Guid>()))
            .Returns((Guid id) => BuildRefreshTokenDetails(id, "refresh-token"));

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new AccessTokenDetails
                {
                    Value = "access-token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TokenConfig.AccessTokenValidForMinutes),
                }
            );

        _ = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        var user = await Context.Users.FirstAsync(x => x.Email == "mixedcase@example.com");
        using (Assert.EnterMultipleScope())
        {
            Assert.That(user.Email, Is.EqualTo("mixedcase@example.com"));
            Assert.That(user.Username, Is.EqualTo("mixeduser"));
        }
    }

    [Test]
    public async Task CompleteSignUpAsync_WithMixedInterests_StoresLowercaseDistinctInterests()
    {
        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "new@example.com",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = "1990-01-01",
            Interests = ["Coins", " STAMPS ", "coins", ""],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("new@example.com", SignUpConfig.SignUpPurpose))
            .Returns(true);

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<Guid>()))
            .Returns((Guid id) => BuildRefreshTokenDetails(id, "refresh-token"));

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new AccessTokenDetails
                {
                    Value = "access-token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TokenConfig.AccessTokenValidForMinutes),
                }
            );

        _ = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        var user = await Context
            .Users.Include(x => x.Hobbies)
            .FirstAsync(x => x.Email == "new@example.com");
        Assert.That(user.Hobbies.Select(x => x.Name), Is.EquivalentTo(["coins", "stamps"]));
    }

    [Test]
    public async Task CompleteSignUpAsync_UsesExistingHobby_InsteadOfDuplicating()
    {
        Context.Hobbies.Add(new HobbyEntity { Name = "coins" });
        await Context.SaveChangesAsync();

        var request = new CompleteSignUpRequest
        {
            Username = "newuser",
            Email = "new@example.com",
            Password = "Password123!",
            Firstname = "First",
            Lastname = "Last",
            DateOfBirth = "1990-01-01",
            Interests = ["Coins"],
        };

        _otpServiceMock
            .Setup(x => x.IsVerified("new@example.com", SignUpConfig.SignUpPurpose))
            .Returns(true);

        _tokenServiceMock
            .Setup(x => x.CreateRefreshToken(It.IsAny<Guid>()))
            .Returns((Guid id) => BuildRefreshTokenDetails(id, "refresh-token"));

        _tokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), It.IsAny<int>()))
            .Returns(
                new AccessTokenDetails
                {
                    Value = "access-token",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TokenConfig.AccessTokenValidForMinutes),
                }
            );

        _ = await _signUpService.CompleteSignUpAsync(request, CancellationToken.None);

        var hobbyCount = await Context.Hobbies.CountAsync(x => x.Name == "coins");
        Assert.That(hobbyCount, Is.EqualTo(1));
    }

    #endregion
}
