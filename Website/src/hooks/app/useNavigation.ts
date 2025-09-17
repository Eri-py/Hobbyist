import { createContext, useContext } from "react";

export type NavigationContextTypes = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getActiveTab: (label: string) => boolean;
};

export const NavigationContext = createContext<NavigationContextTypes | null>(null);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider.");
  }
  return context;
}
