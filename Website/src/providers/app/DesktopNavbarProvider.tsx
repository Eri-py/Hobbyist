import { useState, type ReactNode, useMemo } from "react";

import { DesktopNavbarContext, type DesktopNavbarContextTypes } from "@/hooks/app/useDesktopNavbar";

type DesktopNavbarProviderTypes = {
  children: ReactNode;
};

export function DesktopNavbarProvider({ children }: DesktopNavbarProviderTypes) {
  const [searchBar, setSearchBar] = useState<ReactNode>(<div></div>);
  const [rightButtonGroup, setRightButtonGroup] = useState<ReactNode>(<div></div>);

  const value: DesktopNavbarContextTypes = useMemo(
    () => ({
      searchbar: searchBar,
      setSearchbar: setSearchBar,
      rightButtonGroup: rightButtonGroup,
      setRightButtonGroup: setRightButtonGroup,
    }),
    [searchBar, rightButtonGroup]
  );

  return <DesktopNavbarContext.Provider value={value}>{children}</DesktopNavbarContext.Provider>;
}
