import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";
import Badge, { badgeClasses } from "@mui/material/Badge";
import Button from "@mui/material/Button";
import ChatIcon from "@mui/icons-material/Chat";

import { LogoWithName } from "@/components/shared/Logo";
import { NavbarContainer } from "./NavbarContainer";
import { useAuth } from "@/hooks/app/useAuth";
import { useMobileNavbar } from "@/hooks/app/useMobileNavbar";

const CustomBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -0.5rem;
    right: 0rem;
  }
`;

export function MobileNavbar() {
  const { isAuthenticated } = useAuth();
  const { openMobileSearchOverlay } = useMobileNavbar();

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
          <IconButton onClick={openMobileSearchOverlay}>
            <SearchIcon />
          </IconButton>

          {isAuthenticated && (
            <IconButton>
              <ChatIcon />
              <CustomBadge badgeContent={2} color="primary" overlap="circular" />
            </IconButton>
          )}
        </Stack>
      </Toolbar>
    </NavbarContainer>
  );
}
