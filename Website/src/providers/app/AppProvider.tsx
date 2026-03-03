import type { ReactNode } from "react";

import { MobileHeaderProvider } from "./MobileHeaderProvider";
import { SidebarProvider } from "./SidebarProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <MobileHeaderProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </MobileHeaderProvider>
  );
}
