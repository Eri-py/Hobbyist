import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";

import { LogoWithName } from "@/components/shared/Logo";
import { NavbarContainer } from "./NavbarContainer";
import { useMobileSearchOverlay } from "@/hooks/app/useMobileSearchOverlay";

export function MobileNavbar() {
  const { openOverlay } = useMobileSearchOverlay();

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{ justifyContent: "space-between", paddingInline: "0.25rem !important" }}
      >
        <Button
          variant="text"
          sx={{
            "&:hover": {
              background: "none",
            },
          }}
        >
          <LogoWithName size="medium" />
        </Button>

        <Stack direction="row" alignItems="center">
          <IconButton onClick={openOverlay}>
            <SearchIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </NavbarContainer>
  );
}
