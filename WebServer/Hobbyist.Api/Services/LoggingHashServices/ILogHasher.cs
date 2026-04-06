namespace Hobbyist.Api.Services.LoggingHashServices;

public interface ILogHasher
{
    string Hash(string? value);
}
