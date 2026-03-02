import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { LogoWithName } from "@/components/shared/Logo";
import { NavbarContainer } from "./NavbarContainer";
import { useDesktopHeader } from "@/hooks/app/useDesktopHeader";

export function DesktopNavbar() {
  const { searchBar, rightButtons } = useDesktopHeader();

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "1.35rem !important",
          paddingBlock: 1,
        }}
      >
        {/* Left: Logo */}
        <Stack direction="row" alignItems="center">
          <Button
            variant="text"
            disableRipple
            sx={{
              "&:hover": {
                background: "none",
              },
            }}
          >
            <LogoWithName size="medium" />
          </Button>
        </Stack>

        {/* Center: Search Bar */}
        {searchBar}

        {/* Right: Buttons */}
        {rightButtons}
      </Toolbar>
    </NavbarContainer>
  );
}
