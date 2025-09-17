import { useEffect, type ReactNode } from "react";
import { useDesktopNavbar } from "./useDesktopNavbar";
import { useMobileSearchOverlay } from "./useMobileSearchOverlay";
import { useNavigation } from "./useNavigation";

type RouteSetupConfigs = {
  activeNavigationTab: string;
  desktopSearchBar: ReactNode;
  desktopRightButtonGroup: ReactNode;
  mobileSearchOverlay: ReactNode;
};

export function useRouteSetup({
  activeNavigationTab,
  desktopSearchBar,
  desktopRightButtonGroup,
  mobileSearchOverlay,
}: RouteSetupConfigs) {
  const { setSearchbar, setRightButtonGroup } = useDesktopNavbar();
  const { setSearchOverlay } = useMobileSearchOverlay();
  const { setActiveTab } = useNavigation();

  // Set active navigation tab
  useEffect(() => {
    setActiveTab(activeNavigationTab);
  }, [activeNavigationTab, setActiveTab]);

  // Set and clear desktop searchbar
  useEffect(() => {
    setSearchbar(desktopSearchBar);
  }, [desktopSearchBar, setSearchbar]);

  // Set and clear desktop right button group
  useEffect(() => {
    setRightButtonGroup(desktopRightButtonGroup);
  }, [desktopRightButtonGroup, setRightButtonGroup]);

  useEffect(() => {
    setSearchOverlay(mobileSearchOverlay);
  }, [mobileSearchOverlay, setSearchOverlay]);
}
