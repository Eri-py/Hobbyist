import { createContext, useContext, useEffect, type ReactNode } from "react";

export type DesktopHeaderContextTypes = {
  searchBar: ReactNode;
  setSearchBar: (searchBar: ReactNode) => void;
  rightButtons: ReactNode;
  setRightButtons: (rightButtons: ReactNode) => void;
};

export const DesktopHeaderContext = createContext<DesktopHeaderContextTypes | null>(null);

export function useDesktopHeader() {
  const context = useContext(DesktopHeaderContext);
  if (!context) {
    throw new Error("useDesktopHeader must be used within a DesktopHeaderProvider.");
  }
  return context;
}

type DesktopHeaderConfigTypes = {
  searchBar?: ReactNode;
  rightButtons?: ReactNode;
};
// Helper hook for routes to configure desktop header
export function useDesktopHeaderConfig({ searchBar, rightButtons }: DesktopHeaderConfigTypes) {
  const { setSearchBar, setRightButtons } = useDesktopHeader();

  // Set and clear search bar
  useEffect(() => {
    setSearchBar(searchBar || null);
    return () => setSearchBar(null);
  }, [searchBar, setSearchBar]);

  // Set and clear right buttons
  useEffect(() => {
    setRightButtons(rightButtons || null);
    return () => setRightButtons(null);
  }, [rightButtons, setRightButtons]);
}
