import { useCallback, useMemo } from "react";

import { useLocation, useNavigate } from "@tanstack/react-router";

import { useProfile } from "@/hooks/profile/useProfile";
import { useAuth, useFeatureFlags } from "@hobbyist/hooks";
import { FeatureFlags } from "@hobbyist/types";

type AppNavLabel = "Home" | "Trade" | "Events" | "Create" | "Messages" | "Profile";

export type DesktopNavbarItem = {
  key: "home" | "trade" | "events";
  label: AppNavLabel;
  handleClick: () => void;
};

export type MobileNavbarItem = {
  key: "home" | "events" | "create" | "messages" | "profile";
  label: AppNavLabel;
  handleClick: () => void;
  notifications?: number;
};

// Map routes to active tabs
const ROUTE_TO_TAB_MAP: Record<string, string> = {
  "/": "Home",
  "/trade": "Trade",
  "/events": "Events",
  "/create": "Create",
  "/messages": "Messages",
  "/search": "Search",
  "/settings": "Settings",
};

export function useNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const flags = useFeatureFlags();
  const { handleProfileClick } = useProfile();

  const getActiveTabFromPath = (pathname: string): string => {
    // Check if viewing own profile
    if (user && pathname.startsWith(`/profile/${user.username}`)) {
      return "Profile";
    }

    // Then check static routes
    return ROUTE_TO_TAB_MAP[pathname] ?? "";
  };

  const activeTab = getActiveTabFromPath(location.pathname);
  const getActiveTab = (label: string) => activeTab === label;

  const handleHomeClick = useCallback(() => {
    navigate({ to: "/" });
  }, [navigate]);

  const handleTradeClick = useCallback(() => {
    navigate({ to: "/trade" });
  }, [navigate]);

  const handleEventsClick = useCallback(() => {
    navigate({ to: "/events" });
  }, [navigate]);

  const handleCreateClick = useCallback(() => {
    navigate({ to: "/create" });
  }, [navigate]);

  const handleMessagesClick = useCallback(() => {
    navigate({ to: "/messages" });
  }, [navigate]);

  const desktopItems = useMemo<DesktopNavbarItem[]>(() => {
    const items: DesktopNavbarItem[] = [
      { key: "home", label: "Home", handleClick: handleHomeClick },
    ];

    if (flags[FeatureFlags.Trade]) {
      items.push({ key: "trade", label: "Trade", handleClick: handleTradeClick });
    }

    if (flags[FeatureFlags.Events]) {
      items.push({ key: "events", label: "Events", handleClick: handleEventsClick });
    }

    return items;
  }, [flags, handleHomeClick, handleTradeClick, handleEventsClick]);

  const mobileItems = useMemo<MobileNavbarItem[]>(() => {
    const items: MobileNavbarItem[] = [
      { key: "home", label: "Home", handleClick: handleHomeClick },
    ];

    if (flags[FeatureFlags.Events]) {
      items.push({ key: "events", label: "Events", handleClick: handleEventsClick });
    }

    items.push({ key: "create", label: "Create", handleClick: handleCreateClick });

    if (flags[FeatureFlags.Messages]) {
      items.push({
        key: "messages",
        label: "Messages",
        notifications: 2,
        handleClick: handleMessagesClick,
      });
    }

    items.push({ key: "profile", label: "Profile", handleClick: handleProfileClick });

    return items;
  }, [
    flags,
    handleHomeClick,
    handleEventsClick,
    handleCreateClick,
    handleMessagesClick,
    handleProfileClick,
  ]);

  return {
    activeTab,
    getActiveTab,
    desktopItems,
    mobileItems,
  };
}
