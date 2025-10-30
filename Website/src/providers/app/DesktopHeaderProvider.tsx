import { useState, type ReactNode } from "react";
import { DesktopHeaderContext } from "@/hooks/app/useDesktopHeader";
import { RightButtonGroup } from "@/components/app/RightButtonGroup";

// Default search bar component
const DefaultSearchBar = () => <div></div>;

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
