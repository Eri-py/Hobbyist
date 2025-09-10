import { createFileRoute, Outlet } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useBreakpoint } from "@/shared/hooks/useBreakpoint";
import { DesktopNavbar } from "@/components/app/Navbar/DesktopNavbar";
import { BottomNavbar } from "@/components/app/Navbar/BottomNavbar";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";
import { Sidebar } from "@/components/app/Sidebar/Sidebar";

import { DesktopNavbarProvider } from "@/providers/app/DesktopNavbarProvider";
import { MobileNavbarProvider } from "@/providers/app/MobileNavbarProvider";
import { SidebarProvider } from "@/providers/app/SidebarProvider";
import { AuthProvider } from "@/providers/app/AuthProvider";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AuthProvider>
      <DesktopNavbarProvider>
        <SidebarProvider>
          <MobileNavbarProvider>
            <AppContent />
          </MobileNavbarProvider>
        </SidebarProvider>
      </DesktopNavbarProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isSmOrLarger } = useBreakpoint();

  return (
    <Stack>
      {/* Header */}
      {isSmOrLarger ? <DesktopNavbar /> : <MobileNavbar />}

      {/* Main content area */}
      <Stack
        direction="column"
        height={{ xs: "calc(100dvh - 3.25rem - 3rem)", sm: "calc(100dvh - 3.75rem)" }}
      >
        <Stack
          direction={isSmOrLarger ? "row" : "column"}
          flex={1}
          overflow="hidden"
          gap={isSmOrLarger ? 2 : 0}
        >
          {isSmOrLarger && <Sidebar />}
          <Stack
            flex={1}
            alignItems="center"
            overflow="auto"
            padding={isSmOrLarger ? 1 : 0}
            gap={isSmOrLarger ? "1.75rem" : 0}
          >
            <Outlet />
          </Stack>
        </Stack>
      </Stack>

      {/* Mobile footer */}
      {!isSmOrLarger && <BottomNavbar />}
    </Stack>
  );
}
