import { createContext, useContext } from "react";

export type MobileNavbarContextTypes = {
  isMobileSearchOverlayOpen: boolean;
  openMobileSearchOverlay: () => void;
  closeMobileSearchOverlay: () => void;
};

export const MobileNavbarContext = createContext<MobileNavbarContextTypes | null>(null);

export function useMobileNavbar() {
  const context = useContext(MobileNavbarContext);
  if (!context) {
    throw new Error("useMobileNavbar must be used within a MobileNavbarProvider.");
  }
  return context;
}
