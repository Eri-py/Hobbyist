import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { DesktopNavbarProvider } from "./DesktopNavbarProvider";
import { MobileSearchOverlayProvider } from "./MobileSearchOverlayProvider";
import { SidebarProvider } from "./SidebarProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DesktopNavbarProvider>
        <SidebarProvider>
          <MobileSearchOverlayProvider>{children}</MobileSearchOverlayProvider>
        </SidebarProvider>
      </DesktopNavbarProvider>
    </AuthProvider>
  );
}
