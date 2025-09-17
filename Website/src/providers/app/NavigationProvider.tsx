import { useState, type ReactNode, useMemo } from "react";

import { NavigationContext, type NavigationContextTypes } from "@/hooks/app/useNavigation";

type NavigationProviderTypes = {
  children: ReactNode;
};

export function NavigationProvider({ children }: NavigationProviderTypes) {
  const [activeTab, setActiveTab] = useState<string>("Home");
  const value: NavigationContextTypes = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      getActiveTab: (label: string) => {
        return label.localeCompare(activeTab, undefined, { sensitivity: "base" }) === 0;
      },
    }),
    [activeTab]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
