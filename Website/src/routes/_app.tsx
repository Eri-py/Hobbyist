import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Stack from "@mui/material/Stack";

import { useBreakpoint } from "@/shared/hooks/useBreakpoint";
import { getUserDetails } from "@/api/AuthApi";
import { AuthContext } from "@/features/app/hooks/useAuth";
import { BottomNavbar } from "@/features/app/Navbar/BottomNavbar";
import { DesktopNavbar } from "@/features/app/Navbar/DesktopNavbar";
import { MobileNavbar } from "@/features/app/Navbar/MobileNavbar";
import { Sidebar } from "@/features/app/Sidebar/Sidebar";
import { Loader } from "@/features/app/Loader/Loader";
import { MobileSearchOverlayContext } from "@/features/app/hooks/useMobileSearchOverlay";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMobileSearchOverlayOpen, setIsSearchOverlayOpen] = useState<boolean>(false);
  const { isSmOrLarger } = useBreakpoint();

  // Fetch user details on website mount.
  const { data, isPending } = useQuery({
    queryKey: ["userDetails"],
    queryFn: getUserDetails,
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
  });

  const authContextValue = {
    isAuthenticated: data?.data.isAuthenticated,
    user: data?.data.user,
  };

  return isPending ? (
    <Loader />
  ) : (
    <AuthContext.Provider value={authContextValue}>
      <Stack>
        {/* Header */}
        {isSmOrLarger ? (
          <DesktopNavbar onMenuClick={() => setIsMenuOpen(!isMenuOpen)} />
        ) : (
          <MobileNavbar onSearchClick={() => setIsSearchOverlayOpen(true)} />
        )}

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
            {isSmOrLarger && <Sidebar isOpen={isMenuOpen} />}
            <Stack
              flex={1}
              alignItems="center"
              overflow="auto"
              padding={isSmOrLarger ? 1 : 0}
              gap={isSmOrLarger ? "1.75rem" : 0}
            >
              <MobileSearchOverlayContext.Provider value={{ isMobileSearchOverlayOpen }}>
                <Outlet />
              </MobileSearchOverlayContext.Provider>
            </Stack>
          </Stack>
        </Stack>

        {/* Mobile footer */}
        {!isSmOrLarger && <BottomNavbar />}
      </Stack>
    </AuthContext.Provider>
  );
}
