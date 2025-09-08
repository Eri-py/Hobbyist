import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { AxiosResponse } from "axios";

import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  getSearchHistory,
  getSearchSuggestions,
  addOrUpdateSearchTerm,
  removeSearchTerms,
  type getSearchSuggestionsRequest,
  type getSearchSuggestionsResponse,
} from "@/api/HomeApi";

export type SearchOption = {
  name: string;
  category: string;
};

export function useSearch() {
  const [inputValue, setInputValue] = useState<string>("");
  const [searchHistory, setSearchHistory] = useState<SearchOption[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchOption[]>([]);
  const [removedTerms, setRemovedTerms] = useState<string[]>([]);
  const navigate = useNavigate();

  const debouncedSearchQuery = useDebounce(inputValue);
  const debouncedRemovedTerms = useDebounce(removedTerms, 1500);

  // Get user search history
  const { data: historyData, isPending: isHistoryLoading } = useQuery({
    queryKey: ["userSearches"],
    queryFn: getSearchHistory,
  });

  // Convert API data to SearchOption format
  useEffect(() => {
    if (historyData?.data?.result && !isHistoryLoading) {
      setSearchHistory(
        historyData.data.result.map((term: string) => ({
          name: term,
          category: "Recent searches",
        }))
      );
    }
  }, [historyData, isHistoryLoading]);

  // Handle search suggestions
  const { mutate: getSuggestions, isPending: isSuggestionsLoading } = useMutation({
    mutationFn: (data: getSearchSuggestionsRequest) => getSearchSuggestions(data),
    onSuccess: (response: AxiosResponse<getSearchSuggestionsResponse>) => {
      setSearchSuggestions(response.data.result);
    },
  });

  // Get suggestions when query changes
  useEffect(() => {
    if (debouncedSearchQuery.length > 0) {
      getSuggestions({ query: debouncedSearchQuery });
    }
  }, [debouncedSearchQuery, getSuggestions]);

  // Remove terms after debounce
  useEffect(() => {
    if (debouncedRemovedTerms.length > 0) {
      removeSearchTerms({ searchTerms: debouncedRemovedTerms });
      setRemovedTerms([]);
    }
  }, [debouncedRemovedTerms]);

  // Handle removing search history items
  const handleRemoveSearchTerm = (optionToRemove: SearchOption) => {
    setSearchHistory((prev) => prev.filter((item) => item !== optionToRemove));
    setRemovedTerms((prev) => [...prev, optionToRemove.name]);
  };

  // Handle adding a search term and navigation
  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      addOrUpdateSearchTerm({ searchTerm: trimmedQuery });
      navigate({ to: "/search", search: { q: trimmedQuery } });
    }
  };

  return {
    inputValue,
    setInputValue,
    searchHistory,
    searchSuggestions,
    isLoading: isSuggestionsLoading,
    handleRemoveSearchTerm,
    handleSearch,
    debouncedSearchQuery,
  };
}
