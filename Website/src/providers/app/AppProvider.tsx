import type { ReactNode } from "react";

import { DesktopHeaderProvider } from "./DesktopHeaderProvider";
import { MobileHeaderProvider } from "./MobileHeaderProvider";
import { SidebarProvider } from "./SidebarProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <DesktopHeaderProvider>
      <MobileHeaderProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </MobileHeaderProvider>
    </DesktopHeaderProvider>
  );
}
