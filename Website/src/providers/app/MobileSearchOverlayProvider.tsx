import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  MobileSearchOverlayContext,
  type MobileSearchOverlayContextTypes,
} from "@/hooks/app/useMobileSearchOverlay";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { MobileSearchOverlayContainer } from "@/components/shared/MobileSearchOverlayContainer";

type MobileSearchOverlayProviderTypes = {
  children: ReactNode;
};

export function MobileSearchOverlayProvider({ children }: MobileSearchOverlayProviderTypes) {
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [searchOverlay, setSearchOverlay] = useState<ReactNode>(<div></div>);
  const { isDesktop } = useBreakpoint();

  // Reset mobile search overlay if screensize changes.
  useEffect(() => {
    if (isDesktop) {
      setIsOverlayOpen(false);
    }
  }, [isDesktop]);

  const openOverlay = useCallback(() => {
    setIsOverlayOpen(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setIsOverlayOpen(false);
  }, []);

  const value: MobileSearchOverlayContextTypes = useMemo(
    () => ({
      searchOverlay: searchOverlay,
      setSearchOverlay: setSearchOverlay,
      isOverlayOpen: isOverlayOpen,
      openOverlay: openOverlay,
      closeOverlay: closeOverlay,
    }),
    [closeOverlay, isOverlayOpen, openOverlay, searchOverlay, setSearchOverlay]
  );

  return (
    <MobileSearchOverlayContext.Provider value={value}>
      {children}
      <MobileSearchOverlayContainer isOpen={isOverlayOpen}>
        {searchOverlay}
      </MobileSearchOverlayContainer>
    </MobileSearchOverlayContext.Provider>
  );
}
