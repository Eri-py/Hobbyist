import Stack from "@mui/material/Stack";

import { useSidebar } from "@/hooks/app/useSidebar";
import { DesktopNavbar } from "@/components/app/Navbar/DesktopNavbar";
import { Sidebar } from "@/components/app/Sidebar/Sidebar";
import { CustomOutlet } from "./CustomOutlet";

export function DesktopLayout() {
  const { isSidebarOpen } = useSidebar();

  return (
    <Stack sx={{ height: "100dvh", overflow: "hidden" }}>
      <Stack flex={1} direction="row" overflow="hidden">
        <Stack
          flex={1}
          maxWidth={isSidebarOpen ? 340 : 96}
          overflow="visible"
          sx={{ transition: "width 180ms ease" }}
        >
          <Sidebar />
        </Stack>

        <Stack flex={3} overflow="hidden">
          <DesktopNavbar />
          <CustomOutlet padding={2} minHeight={0} />
        </Stack>

        <Stack
          flex={1}
          maxWidth={340}
          borderLeft={1}
          borderColor="pink"
          bgcolor="background.paper"
        />
      </Stack>
    </Stack>
  );
}
