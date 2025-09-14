import { createFileRoute, Outlet } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { DesktopNavbar } from "@/components/app/Navbar/DesktopNavbar";
import { BottomNavbar } from "@/components/app/BottomNavbar/BottomNavbar";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";
import { Sidebar } from "@/components/app/Sidebar/Sidebar";
import { AppProvider } from "@/providers/app/AppProvider";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isDesktop } = useBreakpoint();

  return (
    <AppProvider>
      <Stack>
        {/* Header */}
        {isDesktop ? <DesktopNavbar /> : <MobileNavbar />}

        {/* Main content area */}
        <Stack
          direction="column"
          height={{ xs: "calc(100dvh - 2.75rem - 3rem)", md: "calc(100dvh - 3.75rem)" }}
        >
          <Stack
            direction={isDesktop ? "row" : "column"}
            flex={1}
            overflow="hidden"
            gap={isDesktop ? 2 : 0}
          >
            {isDesktop && <Sidebar />}
            <Outlet />
          </Stack>
        </Stack>

        {/* Mobile footer */}
        {!isDesktop && <BottomNavbar />}
      </Stack>
    </AppProvider>
  );
}
