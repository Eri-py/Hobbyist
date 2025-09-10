import { useState, type ReactNode, useMemo } from "react";

import { DesktopNavbarContext, type DesktopNavbarContextTypes } from "@/hooks/app/useDesktopNavbar";

type DesktopNavbarProviderTypes = {
  children: ReactNode;
};

export function DesktopNavbarProvider({ children }: DesktopNavbarProviderTypes) {
  const [desktopSearchBar, setDesktopSearchBar] = useState<ReactNode>(<div></div>);
  const [desktopLeftButtonGroup, setDesktopLeftButtonGroup] = useState<ReactNode>(<div></div>);

  const value: DesktopNavbarContextTypes = useMemo(
    () => ({
      searchbar: desktopSearchBar,
      setSearchbar: setDesktopSearchBar,
      leftButtonGroup: desktopLeftButtonGroup,
      setLeftButtonGroup: setDesktopLeftButtonGroup,
    }),
    [desktopSearchBar, desktopLeftButtonGroup]
  );

  return <DesktopNavbarContext.Provider value={value}>{children}</DesktopNavbarContext.Provider>;
}
