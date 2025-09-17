import { useCallback, useMemo, useState, type ReactNode } from "react";

import { SidebarContext, type SidebarContextTypes } from "@/hooks/app/useSidebar";

type SidebarProviderTypes = {
  children: ReactNode;
};

export function SidebarProvider({ children }: SidebarProviderTypes) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  const value: SidebarContextTypes = useMemo(
    () => ({
      isSidebarOpen: isSidebarOpen,
      toggleSidebar: toggleSidebar,
    }),
    [isSidebarOpen, toggleSidebar]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
