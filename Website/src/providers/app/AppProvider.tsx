import type { ReactNode } from "react";

import { DesktopHeaderProvider } from "./DesktopHeaderProvider";
import { MobileHeaderProvider } from "./MobileHeaderProvider";
import { SidebarProvider } from "./SidebarProvider";
import { AuthProvider } from "./AuthProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DesktopHeaderProvider>
        <MobileHeaderProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </MobileHeaderProvider>
      </DesktopHeaderProvider>
    </AuthProvider>
  );
}
