import Stack from "@mui/material/Stack";

import { useAuth, useFeatureFlags } from "@hobbyist/hooks";
import { FeatureFlags } from "@hobbyist/types";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { DesktopNavbar } from "@/components/app/Navbar/DesktopNavbar";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";
import { LeftSidebar } from "@/components/app/Sidebar/LeftSidebar";
import { RightSidebar } from "@/components/app/Sidebar/RightSidebar";
import { Outlet } from "@tanstack/react-router";

import { BottomNavbar } from "@/components/app/BottomNavbar/BottomNavbar";

export function ResponsiveLayout() {
  const { isDesktop } = useDeviceType();
  const { isAuthenticated } = useAuth();
  const flags = useFeatureFlags();

  return (
    <Stack sx={{ height: "100dvh", overflow: "hidden" }}>
      {!isDesktop && <MobileNavbar />}
      <Stack
        direction={isDesktop ? "row" : "column"}
        sx={{
          flex: 1,
          overflow: "hidden",
        }}
      >
        {isDesktop && (
          <Stack
            sx={{
              flex: 1,
              maxWidth: 96,
            }}
          >
            <LeftSidebar />
          </Stack>
        )}

        <Stack
          sx={{
            flex: isDesktop ? 3 : 1,
            overflow: "hidden",
            paddingBottom: isDesktop ? 0 : 7,
          }}
        >
          {isDesktop && <DesktopNavbar />}
          <Stack
            component="main"
            sx={{
              flex: 1,
              minHeight: isDesktop ? 0 : undefined,
              overflow: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <Outlet />
          </Stack>
        </Stack>

        {isDesktop && isAuthenticated && flags[FeatureFlags.RightSidebar] && (
          <Stack
            sx={{
              flex: 1,
              maxWidth: 340,
            }}
          >
            <RightSidebar />
          </Stack>
        )}
      </Stack>
      {!isDesktop && <BottomNavbar />}
    </Stack>
  );
}
