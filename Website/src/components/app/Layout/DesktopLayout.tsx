import Stack from "@mui/material/Stack";

import { useAuth } from "@hobbyist/hooks";
import { useSidebar } from "@/hooks/app/useSidebar";
import { DesktopNavbar } from "@/components/app/Navbar/DesktopNavbar";
import { LeftSidebar } from "@/components/app/Sidebar/LeftSidebar";
import { RightSidebar } from "@/components/app/Sidebar/RightSidebar";
import { CustomOutlet } from "./CustomOutlet";

export function DesktopLayout() {
  const { isSidebarOpen } = useSidebar();
  const { isAuthenticated } = useAuth();

  return (
    <Stack sx={{ height: "100dvh", overflow: "hidden" }}>
      <Stack flex={1} direction="row" overflow="hidden">
        <Stack
          flex={1}
          maxWidth={isSidebarOpen ? 340 : 96}
          overflow="visible"
          sx={{ transition: "width 180ms ease" }}
        >
          <LeftSidebar />
        </Stack>

        <Stack flex={3} overflow="hidden">
          <DesktopNavbar />
          <CustomOutlet padding={2} minHeight={0} />
        </Stack>

        {isAuthenticated && (
          <Stack flex={1} maxWidth={340}>
            <RightSidebar />
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
