import { useCallback, useMemo, useState, type ReactNode } from "react";

import { SidebarContext, type SidebarContextTypes } from "@/hooks/app/useSidebar";

type SidebarProviderTypes = {
  children: ReactNode;
};

// SidebarProvider.tsx (updated with persistence)
export function SidebarProvider({ children }: SidebarProviderTypes) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved ? JSON.parse(saved) : true;
  });

  const toggleSidebar = useCallback(() => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", JSON.stringify(newState));
  }, [isSidebarOpen]);

  const value: SidebarContextTypes = useMemo(
    () => ({
      isSidebarOpen,
      toggleSidebar,
    }),
    [isSidebarOpen, toggleSidebar]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
