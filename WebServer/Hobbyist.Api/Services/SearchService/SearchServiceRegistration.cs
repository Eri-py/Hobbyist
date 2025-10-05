using System;

namespace Hobbyist.Api.Services.SearchService;

public static class SearchServiceRegistration
{
    public static void AddSearchServices(this IServiceCollection services)
    {
        services.AddScoped<ISearchService, SearchService>();
    }
}
