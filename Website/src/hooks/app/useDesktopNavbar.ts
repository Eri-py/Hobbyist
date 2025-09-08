import { createContext, useContext, type ReactNode } from "react";

export type DesktopNavbarContextTypes = {
  searchbar: ReactNode;
  setSearchbar: (searchbar: ReactNode) => void;
  leftButtonGroup: ReactNode;
  setLeftButtonGroup: (leftButtonGroup: ReactNode) => void;
};

export const DesktopNavbarContext = createContext<DesktopNavbarContextTypes | null>(null);

export function useDesktopNavbar() {
  const context = useContext(DesktopNavbarContext);
  if (!context) {
    throw new Error("useDesktopNavbar must be used within a DesktopNavbarProvider.");
  }
  return context;
}
