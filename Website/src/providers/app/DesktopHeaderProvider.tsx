import { useState, type ReactNode } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { DesktopHeaderContext } from "@/hooks/app/useDesktopHeader";
import { RightButtonGroup } from "@/components/app/RightButtonGroup";

// Default search bar component
const DefaultSearchBar = () => (
  <TextField
    placeholder="Search"
    size="small"
    sx={{ width: { lg: 360, xl: 700 } }}
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" fontSize="small" />
          </InputAdornment>
        ),
      },
    }}
  />
);

type DesktopHeaderProviderTypes = {
  children: ReactNode;
};

export function DesktopHeaderProvider({ children }: DesktopHeaderProviderTypes) {
  const [customSearchBar, setCustomSearchBar] = useState<ReactNode | null>(null);
  const [customRightButtons, setCustomRightButtons] = useState<ReactNode | null>(null);

  const searchBar = customSearchBar ?? <DefaultSearchBar />;
  const rightButtons = customRightButtons ?? <RightButtonGroup />;

  const value = {
    searchBar,
    rightButtons,
    setSearchBar: setCustomSearchBar,
    setRightButtons: setCustomRightButtons,
  };

  return <DesktopHeaderContext.Provider value={value}>{children}</DesktopHeaderContext.Provider>;
}
