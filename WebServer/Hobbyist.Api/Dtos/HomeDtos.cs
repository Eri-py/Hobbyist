using System.ComponentModel.DataAnnotations;

namespace Hobbyist.Api.Dtos;

/// <summary>
/// Defines the shape of data expected from the web client when requesting search suggestions
/// </summary>
public record class GetSearchSuggestionsRequest
{
    /// <summary>Content being searched for to generate suggestions</summary>
    [Required]
    public required string Query { get; set; }
}

/// <summary>
/// Defines the shape of a single search suggestion returned to the web client for autocomplete purposes.
/// </summary>
public record class GetSearchSuggestionDto
{
    /// <summary>Name of user or hobby containing the search query</summary>
    public required string Name { get; set; }

    /// <summary>Category indicating if the suggestion is a user or a hobby</summary>
    public required string Category { get; set; }
}

/// <summary>
/// Defines the shape of the response containing search suggestions returned to the web client for autocomplete.
/// </summary>
public record class GetSearchSuggestionsResponse
{
    /// <summary>List of search suggestions matching the query for autocomplete dropdown</summary>
    public required List<GetSearchSuggestionDto> Result { get; set; }
}

/// <summary>
/// Defines the shape of data expected from the web client when adding a single search term.
/// </summary>
public record class AddOrUpdateSearchTermRequest
{
    /// <summary>Search term to add to user's search history</summary>
    [Required]
    public required string SearchTerm { get; set; }
}

/// <summary>
/// Defines the shape of data expected from the web client when removing search terms.
/// </summary>
public record class RemoveSearchTermsRequest
{
    /// <summary>List of search terms to remove from user's search history</summary>
    [Required]
    public required List<string> SearchTerms { get; set; }
}

/// <summary>
/// Defines the shape of the response containing user's search history.
/// </summary>
public record class GetSearchHistoryResponse
{
    /// <summary>List of search terms from user's history, ordered by frequency</summary>
    public required List<string> Result { get; set; }
}
