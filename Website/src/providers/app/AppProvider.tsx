import type { ReactNode } from "react";

import { FeatureFlagsProvider } from "./FeatureFlagsProvider";
import { MobileHeaderProvider } from "./MobileHeaderProvider";
import { SidebarProvider } from "./SidebarProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <FeatureFlagsProvider>
      <MobileHeaderProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </MobileHeaderProvider>
    </FeatureFlagsProvider>
  );
}
