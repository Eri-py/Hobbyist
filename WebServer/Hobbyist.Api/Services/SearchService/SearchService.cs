using Hobbyist.Api.Data;
using Hobbyist.Api.Data.Entities;
using Hobbyist.Api.Dtos;
using Hobbyist.Common;
using Microsoft.EntityFrameworkCore;

namespace Hobbyist.Api.Services.SearchService;

public class SearchService(HobbyistDbContext context) : ISearchService
{
    public async Task<Result<GetSearchHistoryResponse>> GetSearchHistoryAsync(Guid userId)
    {
        var userSearchTerms = await context
            .Searches.Where(s => s.UserId == userId)
            .OrderByDescending(s => s.SearchedAt)
            .ThenByDescending(s => s.SearchAmount)
            .Select(s => s.SearchTerm)
            .Take(10)
            .ToListAsync();

        return Result<GetSearchHistoryResponse>.Success(
            new GetSearchHistoryResponse { Result = userSearchTerms }
        );
    }

    public async Task<Result<GetSearchSuggestionsResponse>> GetSearchSuggestionsAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Result<GetSearchSuggestionsResponse>.Success(
                new GetSearchSuggestionsResponse { Result = [] }
            );

        query = query.Trim();
        List<GetSearchSuggestionDto> results = [];

        // get all hobbies matching the query
        var hobbies = await context
            .Hobbies.Where(h => h.CategoryName.Contains(query))
            .Select(h => new GetSearchSuggestionDto { Name = h.CategoryName, Category = "hobbies" })
            .ToListAsync();

        // get all users matching the query
        var users = await context
            .Users.Where(u => u.Username.Contains(query))
            .Select(u => new GetSearchSuggestionDto { Name = u.Username, Category = "users" })
            .ToListAsync();

        results.AddRange(hobbies);
        results.AddRange(users);

        return Result<GetSearchSuggestionsResponse>.Success(
            new GetSearchSuggestionsResponse { Result = results }
        );
    }

    public async Task<Result> AddOrUpdateSearchTermAsync(
        AddOrUpdateSearchTermRequest request,
        Guid userId
    )
    {
        var searchTerm = request.SearchTerm.ToLower();
        if (string.IsNullOrWhiteSpace(searchTerm))
            return Result.BadRequest("Search term cannot be empty");

        var existingSearch = await context.Searches.FirstOrDefaultAsync(s =>
            s.UserId == userId && s.SearchTerm == searchTerm
        );

        if (existingSearch != null)
        {
            // Increment search count and update timestamp
            existingSearch.SearchAmount++;
            existingSearch.SearchedAt = DateTime.UtcNow;
        }
        else
        {
            // Add new search term
            var newSearch = new SearchEntity
            {
                UserId = userId,
                SearchTerm = searchTerm,
                SearchAmount = 1,
                SearchedAt = DateTime.UtcNow,
            };
            await context.Searches.AddAsync(newSearch);
        }

        await context.SaveChangesAsync();
        return Result.NoContent();
    }

    public async Task<Result> RemoveSearchTermsAsync(RemoveSearchTermsRequest request, Guid userId)
    {
        // Frontend should not send empty arrays
        if (request.SearchTerms == null || request.SearchTerms.Count == 0)
            return Result.BadRequest("No search terms provided for removal");

        var searchesToRemove = await context
            .Searches.Where(s => s.UserId == userId && request.SearchTerms.Contains(s.SearchTerm))
            .ToListAsync();

        context.Searches.RemoveRange(searchesToRemove);
        await context.SaveChangesAsync();

        return Result.NoContent();
    }
}
