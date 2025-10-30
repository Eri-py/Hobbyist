import Toolbar from "@mui/material/Toolbar";
import Stack from "@mui/material/Stack";

import { NavbarContainer } from "./NavbarContainer";
import { useMobileHeader } from "@/hooks/app/useMobileHeader";

export function MobileNavbar() {
  const { leftSlot, centerSlot, rightSlot } = useMobileHeader();

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "0.25rem !important",
        }}
      >
        {/* Left Slot */}
        <Stack direction="row" alignItems="center">
          {leftSlot}
        </Stack>

        {/* Center Slot */}
        <Stack direction="row" alignItems="center">
          {centerSlot}
        </Stack>

        {/* Right Slot */}
        <Stack direction="row" alignItems="center">
          {rightSlot}
        </Stack>
      </Toolbar>
    </NavbarContainer>
  );
}
