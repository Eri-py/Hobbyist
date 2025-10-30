import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { DesktopHeaderProvider } from "./DesktopHeaderProvider";
import { MobileHeaderProvider } from "./MobileHeaderProvider";
import { SidebarProvider } from "./SidebarProvider";

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
