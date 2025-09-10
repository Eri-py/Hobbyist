import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { DesktopNavbarProvider } from "./DesktopNavbarProvider";
import { MobileNavbarProvider } from "./MobileNavbarProvider";
import { SidebarProvider } from "./SidebarProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DesktopNavbarProvider>
        <SidebarProvider>
          <MobileNavbarProvider>{children}</MobileNavbarProvider>
        </SidebarProvider>
      </DesktopNavbarProvider>
    </AuthProvider>
  );
}
