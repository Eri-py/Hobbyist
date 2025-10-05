using Hobbyist.Api.Dtos;
using Hobbyist.Common;

namespace Hobbyist.Api.Services.SearchService;

/// <summary>
/// Provides services for handling searching functionality including getting search suggestions,
/// managing user search history, and retrieving search history.
/// </summary>
public interface ISearchService
{
    /// <summary>
    /// Compares query value against entries in hobbies and users database to get matching hobbies and usernames
    /// for autocomplete/suggestion purposes.
    /// </summary>
    /// <param name="query">String containing text being searched for.</param>
    /// <returns><see cref="GetSearchSuggestionsResponse"/> containing matching suggestions if found, else an empty list.</returns>
    public Task<Result<GetSearchSuggestionsResponse>> GetSearchSuggestionsAsync(string query);

    /// <summary>
    /// Retrieves the user's search history, ordered by frequency of searches (most searched first).
    /// Returns up to 10 most frequently searched terms.
    /// </summary>
    /// <param name="userId">The unique identifier of the user whose search history is being retrieved.</param>
    /// <returns><see cref="GetSearchHistoryResponse"/> containing the user's search history terms.</returns>
    public Task<Result<GetSearchHistoryResponse>> GetSearchHistoryAsync(Guid userId);

    /// <summary>
    /// Adds a single search term to the user's search history or increments the search count if it already exists.
    /// </summary>
    /// <param name="request">Contains the search term to add.</param>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <returns>A result indicating success or failure of the operation.</returns>
    public Task<Result> AddOrUpdateSearchTermAsync(
        AddOrUpdateSearchTermRequest request,
        Guid userId
    );

    /// <summary>
    /// Removes specified search terms from the user's search history.
    /// </summary>
    /// <param name="request">Contains the list of search terms to remove.</param>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <returns>A result indicating success or failure of the operation.</returns>
    public Task<Result> RemoveSearchTermsAsync(RemoveSearchTermsRequest request, Guid userId);
}
