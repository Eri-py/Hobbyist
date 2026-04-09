namespace Hobbyist.Api.Services.ReccommendationServices.OnboardingServices;

public interface IOnboardingService
{
    public Task<string[]> GetPopularInterestsAsync(CancellationToken ct);
}
