using Hobbyist.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.ReccommendationServices.OnboardingServices;

public class OnboardingService(HobbyistDbContext context) : IOnboardingService
{
    public Task<string[]> GetPopularInterestsAsync(CancellationToken ct)
    {
        return context
            .Hobbies.OrderByDescending(hobby => hobby.Users.Count)
            .ThenBy(hobby => hobby.Name)
            .Select(hobby => hobby.Name)
            .Take(12)
            .AsNoTracking()
            .ToArrayAsync(ct);
    }
}
