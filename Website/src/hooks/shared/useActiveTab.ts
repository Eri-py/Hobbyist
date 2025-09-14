import { useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export function useActiveTab() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    const primaryRoute = location.pathname.split("/")[1] || "Home";
    setActiveTab(primaryRoute);
  }, [location.pathname]);

  const getActiveTab = (label: string) => {
    return label.localeCompare(activeTab, undefined, { sensitivity: "base" }) === 0;
  };

  return {
    activeTab,
    getActiveTab,
  };
}
