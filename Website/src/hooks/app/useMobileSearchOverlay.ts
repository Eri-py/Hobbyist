import { createContext, useContext, type ReactNode } from "react";

export type MobileSearchOverlayContextTypes = {
  searchOverlay: ReactNode;
  setSearchOverlay: (overlay: ReactNode) => void;
  isOverlayOpen: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
};

export const MobileSearchOverlayContext = createContext<MobileSearchOverlayContextTypes | null>(
  null
);

export function useMobileSearchOverlay() {
  const context = useContext(MobileSearchOverlayContext);
  if (!context) {
    throw new Error("useMobileSearchOverlay must be used within a MobileSearchOverlayProvider.");
  }
  return context;
}
