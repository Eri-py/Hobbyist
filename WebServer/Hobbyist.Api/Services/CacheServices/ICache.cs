using System;

namespace Hobbyist.Api.Services.CacheServices;

public interface ICache
{
    public void Set<T>(string key, T value, TimeSpan expiration);
    public bool TryGetValue<T>(string key, out T? value);
    public void Remove(string key);
}
