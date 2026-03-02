import Stack from "@mui/material/Stack";

import { BottomNavbar } from "@/components/app/BottomNavbar/BottomNavbar";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";
import { CustomOutlet } from "./CustomOutlet";

export function MobileLayout() {
  return (
    <Stack sx={{ height: "100dvh", overflow: "hidden" }}>
      <MobileNavbar />

      <Stack direction="column" flex={1} overflow="hidden">
        <CustomOutlet padding={1} />
      </Stack>

      <BottomNavbar />
    </Stack>
  );
}
