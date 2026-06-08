using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace Hobbyist.Api.Services.CacheServices;

public class RedisCacheService(IDistributedCache distributedCache) : ICacheService
{
    public void Set<T>(string key, T value, TimeSpan expiration)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration,
        };
        var json = JsonSerializer.Serialize(value);
        distributedCache.SetString(key, json, options);
    }

    public bool TryGetValue<T>(string key, out T? value)
    {
        var json = distributedCache.GetString(key);
        if (json is null)
        {
            value = default;
            return false;
        }

        value = JsonSerializer.Deserialize<T>(json);
        return true;
    }

    public void Remove(string key)
    {
        distributedCache.Remove(key);
    }
}
