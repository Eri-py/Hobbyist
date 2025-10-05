using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Results;
using Hobbyist.Api.Services.AuthServices;
using Hobbyist.Api.Services.AuthServices.TokenServices;
using Hobbyist.Api.Services.EmailServices;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Hobbyist.Tests.AuthServicesTests;

/// <summary>
/// Base class for authentication tests providing common setup and utilities
/// </summary>
public abstract class AuthTestBase
{
    protected Mock<IEmailService> EmailServiceMock { get; private set; } = null!;
    protected Mock<ITokenService> TokenServiceMock { get; private set; } = null!;
    protected AppDbContext Context { get; private set; } = null!;

    [SetUp]
    public virtual void Setup()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;

        Context = new AppDbContext(options);
        Context.Database.OpenConnection();
        Context.Database.EnsureCreated();

        EmailServiceMock = new Mock<IEmailService>();
        TokenServiceMock = new Mock<ITokenService>();
    }

    [TearDown]
    public async Task TearDown()
    {
        if (Context != null)
        {
            await Context.Database.GetDbConnection().DisposeAsync();
            await Context.DisposeAsync();
        }
    }

    #region Test Data Builders

    protected static UserBuilder CreateUserBuilder() => new();

    public class UserBuilder
    {
        private readonly UserEntity _user = new()
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            Email = "test@test.com",
            RefreshTokens = [],
        };

        public UserBuilder WithUsername(string username)
        {
            _user.Username = username;
            return this;
        }

        public UserBuilder WithEmail(string email)
        {
            _user.Email = email;
            return this;
        }

        public UserBuilder WithPassword(string password)
        {
            var hasher = new PasswordHasher<UserEntity>();
            _user.PasswordHash = hasher.HashPassword(_user, password);
            return this;
        }

        public UserBuilder WithPersonalInfo(
            string firstname = "Test",
            string lastname = "User",
            DateOnly? dateOfBirth = null
        )
        {
            _user.Firstname = firstname;
            _user.Lastname = lastname;
            _user.DateOfBirth = dateOfBirth ?? new DateOnly(1990, 1, 1);
            return this;
        }

        public UserBuilder WithOtp(string otp, DateTime? expiresAt = null)
        {
            _user.Otp = otp;
            _user.OtpExpiresAt = expiresAt ?? DateTime.UtcNow.AddMinutes(5);
            return this;
        }

        public UserBuilder AsIncompleteRegistration()
        {
            _user.CreatedAt = null;
            _user.PasswordHash = null;
            _user.Firstname = null;
            _user.Lastname = null;
            _user.DateOfBirth = null;
            return this;
        }

        public UserBuilder AsCompleteRegistration()
        {
            _user.CreatedAt = DateTime.UtcNow;
            if (string.IsNullOrEmpty(_user.PasswordHash))
                WithPassword("DefaultPassword@123");
            if (string.IsNullOrEmpty(_user.Firstname))
                WithPersonalInfo();
            return this;
        }

        public UserBuilder WithRefreshToken(string tokenHash, DateTime? expiresAt = null)
        {
            _user.RefreshTokens.Add(
                new RefreshTokenEntity
                {
                    TokenHash = tokenHash,
                    TokenExpiresAt = expiresAt ?? DateTime.UtcNow.AddDays(7),
                    UserId = _user.Id,
                }
            );
            return this;
        }

        public UserEntity Build() => _user;
    }

    #endregion

    #region Mock Setup Helpers

    protected TokenDetails SetupOtpCreation(string otp = "123456", int validForMinutes = 5)
    {
        var tokenDetails = new TokenDetails
        {
            Value = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(validForMinutes),
        };

        TokenServiceMock.Setup(x => x.CreateOtp(validForMinutes)).Returns(tokenDetails);

        return tokenDetails;
    }

    protected TokenDetails SetupAccessTokenCreation(
        string token = "access_token",
        int validForMinutes = 15
    )
    {
        var tokenDetails = new TokenDetails
        {
            Value = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(validForMinutes),
        };

        TokenServiceMock
            .Setup(x => x.CreateAccessToken(It.IsAny<UserEntity>(), validForMinutes))
            .Returns(tokenDetails);

        return tokenDetails;
    }

    protected TokenDetails SetupRefreshTokenCreation(
        string token = "refresh_token",
        int validForDays = 7
    )
    {
        var tokenDetails = new TokenDetails
        {
            Value = token,
            ExpiresAt = DateTime.UtcNow.AddDays(validForDays),
        };

        TokenServiceMock.Setup(x => x.CreateRefreshToken(validForDays)).Returns(tokenDetails);

        return tokenDetails;
    }

    protected void SetupTokenHashing(string token, string hashedToken)
    {
        TokenServiceMock.Setup(x => x.HashToken(token)).Returns(hashedToken);
    }

    protected void SetupSuccessfulEmailSending()
    {
        EmailServiceMock
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()
                )
            )
            .ReturnsAsync(Result.NoContent());
    }

    protected void SetupFailedEmailSending(string errorMessage = "Email service error")
    {
        EmailServiceMock
            .Setup(x =>
                x.SendOtpEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()
                )
            )
            .ReturnsAsync(Result.InternalServerError(errorMessage));
    }

    #endregion

    #region Database Helpers

    protected async Task<UserEntity> AddUserToDatabase(UserEntity user)
    {
        Context.Users.Add(user);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();
        return user;
    }

    protected async Task<UserEntity?> GetUserById(Guid userId, bool includeRefreshTokens = false)
    {
        Context.ChangeTracker.Clear();
        var query = Context.Users.AsQueryable();

        if (includeRefreshTokens)
            query = query.Include(u => u.RefreshTokens);

        return await query.FirstOrDefaultAsync(u => u.Id == userId);
    }

    protected async Task<int> GetUserCount()
    {
        Context.ChangeTracker.Clear();
        return await Context.Users.CountAsync();
    }

    #endregion

    #region Assertion Helpers

    protected static void AssertUserEquals(UserEntity expected, UserEntity actual)
    {
        Assert.Multiple(() =>
        {
            Assert.That(actual.Id, Is.EqualTo(expected.Id));
            Assert.That(actual.Username, Is.EqualTo(expected.Username));
            Assert.That(actual.Email, Is.EqualTo(expected.Email));
            Assert.That(actual.PasswordHash, Is.EqualTo(expected.PasswordHash));
            Assert.That(actual.Firstname, Is.EqualTo(expected.Firstname));
            Assert.That(actual.Lastname, Is.EqualTo(expected.Lastname));
            Assert.That(actual.DateOfBirth, Is.EqualTo(expected.DateOfBirth));
            Assert.That(actual.CreatedAt, Is.EqualTo(expected.CreatedAt));
            Assert.That(actual.Otp, Is.EqualTo(expected.Otp));
            Assert.That(actual.OtpExpiresAt, Is.EqualTo(expected.OtpExpiresAt));
        });
    }

    protected static void AssertSuccessResult<T>(Result<T> result)
    {
        Assert.Multiple(() =>
        {
            Assert.That(result.IsSuccess, Is.True);
            Assert.That(result.Content, Is.Not.Null);
        });
    }

    protected static void AssertErrorResult(Result result, string expectedMessage)
    {
        Assert.Multiple(() =>
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.Message, Is.EqualTo(expectedMessage));
        });
    }

    protected static void AssertErrorResult<T>(Result<T> result, string expectedMessage)
    {
        Assert.Multiple(() =>
        {
            Assert.That(result.IsSuccess, Is.False);
            Assert.That(result.Message, Is.EqualTo(expectedMessage));
        });
    }

    protected static void AssertAuthResult(
        AuthResult authResult,
        string expectedAccessToken,
        string expectedRefreshToken,
        DateTime expectedAccessExpiry,
        DateTime expectedRefreshExpiry
    )
    {
        Assert.Multiple(() =>
        {
            Assert.That(authResult.AccessToken, Is.EqualTo(expectedAccessToken));
            Assert.That(authResult.RefreshToken, Is.EqualTo(expectedRefreshToken));
            Assert.That(authResult.AccessTokenExpiresAt, Is.EqualTo(expectedAccessExpiry));
            Assert.That(authResult.RefreshTokenExpiresAt, Is.EqualTo(expectedRefreshExpiry));
        });
    }

    #endregion
}
