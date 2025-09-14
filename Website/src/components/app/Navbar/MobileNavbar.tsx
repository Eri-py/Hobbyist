import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import SearchIcon from "@mui/icons-material/Search";
import EventIcon from "@mui/icons-material/Event";

import { NavbarContainer } from "./NavbarContainer";
import { useMobileSearchOverlay } from "@/hooks/app/useMobileSearchOverlay";
import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";

export function MobileNavbar() {
  const { openOverlay } = useMobileSearchOverlay();
  const { handleEventsClick } = useNavigationButtons();

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{ justifyContent: "space-between", paddingInline: "0.25rem !important" }}
      >
        <IconButton size="large" onClick={handleEventsClick}>
          <EventIcon style={{ fontSize: "1.75rem" }} />
        </IconButton>

        <Stack direction="row" alignItems="center">
          <IconButton onClick={openOverlay}>
            <SearchIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </NavbarContainer>
  );
}
