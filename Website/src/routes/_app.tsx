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

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { isSmOrLarger } = useBreakpoint();

  // Fetch user details on Website mount.
  const { data, isPending } = useQuery({
    queryKey: ["userDetails"],
    queryFn: getUserDetails,
    refetchOnWindowFocus: false,
  });

  const authContextValue = {
    isAuthenticated: data?.data.isAuthenticated,
    user: data?.data.user,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {isPending ? (
        <Loader />
      ) : (
        <Stack>
          {/* Header */}
          {isSmOrLarger ? (
            <DesktopNavbar onMenuClick={() => setIsMenuOpen(!isMenuOpen)} />
          ) : (
            <MobileNavbar onSearchClick={() => {}} /> // TODO: Decide how to handle mobile search mode
          )}

          {/* Main content area */}
          <Stack
            direction="column"
            height={{ xs: "calc(100dvh - 3.25rem - 3rem)", sm: "calc(100dvh - 3.75rem)" }}
          >
            {isSmOrLarger ? (
              <Stack direction="row" flex={1} overflow="hidden" gap={2}>
                <Sidebar isOpen={isMenuOpen} />
                <Stack flex={1} alignItems="center" overflow="auto" padding={1} gap="1.75rem">
                  <Outlet />
                </Stack>
              </Stack>
            ) : (
              <Stack flex={1} alignItems="center" overflow="auto">
                <Outlet />
              </Stack>
            )}
          </Stack>

          {/* Mobile footer */}
          {!isSmOrLarger && <BottomNavbar />}
        </Stack>
      )}
    </AuthContext.Provider>
  );
}
