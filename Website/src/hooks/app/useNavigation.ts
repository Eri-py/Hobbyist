import { useLocation } from "@tanstack/react-router";

// Map routes to active tabs
const ROUTE_TO_TAB_MAP: Record<string, string> = {
  "/": "Home",
  "/trade": "Trade",
  "/events": "Events",
  "/create": "Create",
  "/messages": "Messages",
  "/profile": "Profile",
  "/search": "Search",
  // Add more routes as needed
};

export function useNavigation() {
  const location = useLocation();

  // Auto-detect active tab from current route
  const activeTab = ROUTE_TO_TAB_MAP[location.pathname] || "Home";

  const getActiveTab = (label: string) => activeTab === label;

  return {
    activeTab,
    getActiveTab,
  };
}
