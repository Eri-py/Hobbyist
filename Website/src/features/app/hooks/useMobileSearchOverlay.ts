import { createContext, useContext } from "react";

type MobileSearchOverlayTypes = {
  isMobileSearchOverlayOpen: boolean;
};
export const MobileSearchOverlayContext = createContext<MobileSearchOverlayTypes | null>(null);

export function useMobileSearchOverlay() {
  const context = useContext(MobileSearchOverlayContext);
  if (!context) {
    throw new Error("useMobileSearchOverlay must be used within an MobileSearchOverlayProvider.");
  }
  return context;
}
