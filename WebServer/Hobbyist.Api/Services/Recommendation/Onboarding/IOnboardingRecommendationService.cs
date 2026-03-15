namespace Hobbyist.Api.Services.Recommendation.Onboarding;

public interface IOnboardingRecommendationService
{
    public Task<string[]> GetPopularInterestsAsync(CancellationToken ct);
}
