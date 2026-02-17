import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@hobbyist/hooks";

// Map routes to active tabs
const ROUTE_TO_TAB_MAP: Record<string, string> = {
  "/": "Home",
  "/trade": "Trade",
  "/events": "Events",
  "/create": "Create",
  "/messages": "Messages",
  "/search": "Search",
};

export function useNavigation() {
  const location = useLocation();
  const { user } = useAuth();

  const getActiveTabFromPath = (pathname: string): string => {
    // Check if viewing own profile
    if (user && pathname.startsWith(`/profile/${user.username}`)) {
      return "Profile";
    }

    // Then check static routes
    return ROUTE_TO_TAB_MAP[pathname] || "Home";
  };

  const activeTab = getActiveTabFromPath(location.pathname);
  const getActiveTab = (label: string) => activeTab === label;

  return {
    activeTab,
    getActiveTab,
  };
}
