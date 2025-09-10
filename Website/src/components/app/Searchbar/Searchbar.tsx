import { type FormEvent } from "react";

import Autocomplete from "@mui/material/Autocomplete";

import { AutoCompleteGroup, AutoCompleteOptionItem } from "./AutoCompleteComponents";
import { SearchInput } from "./SearchInput";
import { useSearch } from "@/hooks/app/useSearch";

type SearchbarProps = {
  autoFocus?: boolean;
};

export function Searchbar({ autoFocus }: SearchbarProps) {
  const {
    inputValue,
    setInputValue,
    searchHistory,
    searchSuggestions,
    isLoading,
    handleRemoveSearchTerm,
    handleSearch,
    debouncedSearchQuery,
  } = useSearch();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get("search") as string;
    handleSearch(query);
  };

  return (
    <Autocomplete
      freeSolo
      options={debouncedSearchQuery.length > 0 ? searchSuggestions : searchHistory}
      filterOptions={(options) => options}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      getOptionLabel={(option) => {
        if (typeof option === "string") return option;
        return option.name;
      }}
      groupBy={(option) => option.category}
      renderGroup={(params) => (
        <AutoCompleteGroup
          groupKey={params.key}
          groupName={params.group}
          inputValue={debouncedSearchQuery}
        >
          {params.children}
        </AutoCompleteGroup>
      )}
      renderOption={(props, option) => {
        if (debouncedSearchQuery.length > 0) {
          return <AutoCompleteOptionItem props={props} option={option} />;
        }
        return (
          <AutoCompleteOptionItem props={props} option={option} onRemove={handleRemoveSearchTerm} />
        );
      }}
      renderInput={(params) => (
        <form onSubmit={handleSubmit}>
          <SearchInput params={params} autoFocus={autoFocus} isPending={isLoading} />
        </form>
      )}
      sx={{ flex: 1, maxWidth: "31rem" }}
      slotProps={{
        listbox: {
          sx: {
            overflow: "hidden",
            paddingInline: "0.25rem",
            minHeight: "fit-content",
          },
        },
        popper: {
          placement: "bottom-end",
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 3],
              },
            },
            {
              name: "matchReferenceWidth",
              enabled: true,
              phase: "beforeWrite",
              requires: ["computeStyles"],
              fn: ({ state }) => {
                state.styles.popper.width = `${state.rects.reference.width}px`;
              },
            },
          ],
        },
      }}
    />
  );
}
