import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { DesktopNavbar } from "@/components/app/Navbar/DesktopNavbar";
import { BottomNavbar } from "@/components/app/BottomNavbar/BottomNavbar";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";
import { Sidebar } from "@/components/app/Sidebar/Sidebar";
import { AppProvider } from "@/providers/app/AppProvider";
import { getUserDetails } from "@/api/AuthApi";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    // Public routes that don't require authentication
    const publicRoutes = ["/"];

    try {
      // Call the backend directly to check auth
      const response = await getUserDetails();
      const isAuthenticated = response.data.isAuthenticated;

      if (!publicRoutes.includes(location.pathname) && !isAuthenticated) {
        throw redirect({
          to: "/login",
          search: { redirect: location.pathname },
        });
      }
    } catch {
      if (!publicRoutes.includes(location.pathname)) {
        throw redirect({
          to: "/login",
          search: { redirect: location.pathname },
        });
      }
    }
  },
  pendingComponent: () => <div>Loading</div>,
  component: AppLayout,
});

function AppLayout() {
  const { isDesktop } = useBreakpoint();

  return (
    <AppProvider>
      <Stack sx={{ height: "100dvh", overflow: "hidden" }}>
        {/* Header */}
        {isDesktop ? <DesktopNavbar /> : <MobileNavbar />}

        {/* Main content area */}
        <Stack direction={{ xs: "column", md: "row" }} flex={1} overflow="hidden">
          {isDesktop && <Sidebar />}

          <Stack component="main" flex={1} overflow="auto" padding={{ xs: 1, md: 2 }}>
            <Outlet />
          </Stack>
        </Stack>

        {/* Mobile footer */}
        {!isDesktop && <BottomNavbar />}
      </Stack>
    </AppProvider>
  );
}
