import { useCallback, useMemo, useState, type ReactNode } from "react";
import { MobileNavbarContext, type MobileNavbarContextTypes } from "@/hooks/app/useMobileNavbar";

type MobileNavbarProviderTypes = {
  children: ReactNode;
};

export function MobileNavbarProvider({ children }: MobileNavbarProviderTypes) {
  const [isMobileSearchOverlayOpen, setIsMobileSearchOverlayOpen] = useState<boolean>(false);

  const openMobileSearchOverlay = useCallback(() => {
    setIsMobileSearchOverlayOpen(true);
  }, []);

  const closeMobileSearchOverlay = useCallback(() => {
    setIsMobileSearchOverlayOpen(false);
  }, []);

  const value: MobileNavbarContextTypes = useMemo(
    () => ({
      isMobileSearchOverlayOpen: isMobileSearchOverlayOpen,
      openMobileSearchOverlay: openMobileSearchOverlay,
      closeMobileSearchOverlay: closeMobileSearchOverlay,
    }),
    [closeMobileSearchOverlay, isMobileSearchOverlayOpen, openMobileSearchOverlay]
  );

  return <MobileNavbarContext.Provider value={value}>{children}</MobileNavbarContext.Provider>;
}
