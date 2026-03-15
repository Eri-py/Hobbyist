using Hobbyist.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.Recommendation.Onboarding;

public class OnboardingRecommendationService(HobbyistDbContext context)
    : IOnboardingRecommendationService
{
    public Task<string[]> GetPopularInterestsAsync(CancellationToken ct)
    {
        return context
            .Hobbies.OrderByDescending(hobby => hobby.Users.Count)
            .ThenBy(hobby => hobby.Name)
            .Select(hobby => hobby.Name)
            .Take(20)
            .AsNoTracking()
            .ToArrayAsync(ct);
    }
}
