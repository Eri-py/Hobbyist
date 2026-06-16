namespace Hobbyist.Api.Services.CacheServices;

public interface ICacheService
{
    public void Set<T>(string key, T value, TimeSpan expiration);
    public bool TryGetValue<T>(string key, out T? value);
    public void Remove(string key);
}
