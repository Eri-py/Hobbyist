import { createContext, useContext, type ReactNode } from "react";

export type DesktopNavbarContextTypes = {
  searchbar: ReactNode;
  setSearchbar: (searchbar: ReactNode) => void;
  rightButtonGroup: ReactNode;
  setRightButtonGroup: (rightButtonGroup: ReactNode) => void;
};

export const DesktopNavbarContext = createContext<DesktopNavbarContextTypes | null>(null);

export function useDesktopNavbar() {
  const context = useContext(DesktopNavbarContext);
  if (!context) {
    throw new Error("useDesktopNavbar must be used within a DesktopNavbarProvider.");
  }
  return context;
}
