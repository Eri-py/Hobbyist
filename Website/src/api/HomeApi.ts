import { axiosInstance } from "./axiosInstance";

export type getSearchSuggestionsResponse = { result: { name: string; category: string }[] };

export type getSearchSuggestionsRequest = { query: string };

export type addOrUpdateSearchTermRequest = { searchTerm: string };

export type removeSearchTermsRequest = { searchTerms: string[] };

export const getSearchSuggestions = (data: getSearchSuggestionsRequest) => {
  return axiosInstance.post("home/search-suggestions", data);
};

export const getSearchHistory = () => {
  return axiosInstance.get("home/get-search-history");
};

export const addOrUpdateSearchTerm = (data: addOrUpdateSearchTermRequest) => {
  return axiosInstance.post("home/add-search-term", data);
};

export const removeSearchTerms = (data: removeSearchTermsRequest) => {
  return axiosInstance.post("home/remove-search-terms", data);
};

export const getUserHobbies = () => {
  return axiosInstance.get("home/get-user-hobbies");
};
