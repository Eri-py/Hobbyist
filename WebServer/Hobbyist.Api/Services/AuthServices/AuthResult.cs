namespace Hobbyist.Api.Services.AuthServices;

public record class AuthResult
{
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
    public required DateTime AccessTokenExpiresAt { get; set; }
    public required DateTime RefreshTokenExpiresAt { get; set; }
}
