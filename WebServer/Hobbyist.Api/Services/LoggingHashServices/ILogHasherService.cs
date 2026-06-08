namespace Hobbyist.Api.Services.LoggingHashServices;

public interface ILogHasherService
{
    string Hash(string? value);
}
