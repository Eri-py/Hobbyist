import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import MenuIcon from "@mui/icons-material/Menu";

import { LogoWithName } from "@/components/shared/Logo";
import { NavbarContainer } from "./NavbarContainer";
import { useDesktopHeader } from "@/hooks/app/useDesktopHeader";
import { useSidebar } from "@/hooks/app/useSidebar";

export function DesktopNavbar() {
  const { searchBar, rightButtons } = useDesktopHeader();
  const { toggleSidebar } = useSidebar();

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
        {/* Left: Menu + Logo */}
        <Stack direction="row" alignItems="center">
          <IconButton size="large" onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
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
