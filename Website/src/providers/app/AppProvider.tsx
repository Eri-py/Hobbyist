import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { DesktopNavbarProvider } from "./DesktopNavbarProvider";
import { MobileSearchOverlayProvider } from "./MobileSearchOverlayProvider";
import { SidebarProvider } from "./SidebarProvider";
import { NavigationProvider } from "./NavigationProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DesktopNavbarProvider>
        <SidebarProvider>
          <NavigationProvider>
            <MobileSearchOverlayProvider>{children}</MobileSearchOverlayProvider>
          </NavigationProvider>
        </SidebarProvider>
      </DesktopNavbarProvider>
    </AuthProvider>
  );
}
