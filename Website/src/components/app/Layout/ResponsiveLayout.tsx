import Stack from "@mui/material/Stack";

import { useAuth, useFeatureFlags } from "@hobbyist/hooks";
import { FeatureFlags } from "@hobbyist/types";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useSidebar } from "@/hooks/app/useSidebar";
import { DesktopNavbar } from "@/components/app/Navbar/DesktopNavbar";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";
import { LeftSidebar } from "@/components/app/Sidebar/LeftSidebar";
import { RightSidebar } from "@/components/app/Sidebar/RightSidebar";
import { BottomNavbar } from "@/components/app/BottomNavbar/BottomNavbar";
import { CustomOutlet } from "./CustomOutlet";

export function ResponsiveLayout() {
  const { isDesktop } = useDeviceType();
  const { isSidebarOpen } = useSidebar();
  const { isAuthenticated } = useAuth();
  const flags = useFeatureFlags();

  return (
    <Stack sx={{ height: "100dvh", overflow: "hidden" }}>
      {!isDesktop && <MobileNavbar />}

      <Stack flex={1} direction={isDesktop ? "row" : "column"} overflow="hidden">
        {isDesktop && (
          <Stack
            flex={1}
            maxWidth={isSidebarOpen ? 340 : 96}
            overflow="visible"
            sx={{ transition: "width 180ms ease" }}
          >
            <LeftSidebar />
          </Stack>
        )}

        <Stack flex={isDesktop ? 3 : 1} overflow="hidden" paddingBottom={isDesktop ? 0 : 7}>
          {isDesktop && <DesktopNavbar />}
          <CustomOutlet padding={isDesktop ? 2 : 1} minHeight={isDesktop ? 0 : undefined} />
        </Stack>

        {isDesktop && isAuthenticated && flags[FeatureFlags.RightSidebar] && (
          <Stack flex={1} maxWidth={340}>
            <RightSidebar />
          </Stack>
        )}
      </Stack>

      {!isDesktop && <BottomNavbar />}
    </Stack>
  );
}
