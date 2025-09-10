import { createContext, useContext } from "react";

export type SidebarContextTypes = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const SidebarContext = createContext<SidebarContextTypes | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
