import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ChatIcon from "@mui/icons-material/Chat";
import AddIcon from "@mui/icons-material/Add";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { styled } from "@mui/material/styles";
import Badge, { badgeClasses } from "@mui/material/Badge";
import MenuIcon from "@mui/icons-material/Menu";

import { LogoWithName } from "@/shared/components/Logo";
import { useAuth } from "@/features/app/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { useNavigationButtons } from "../hooks/useNavigationButtons";
import { NavbarContainer } from "./components/NavbarContainer";
import { Searchbar } from "../Searchbar/Searchbar";

const CustomBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -0.5rem;
    right: 0rem;
  }
`;

const AuthButton = styled(Button)({
  borderRadius: "2rem",
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  fontWeight: 400,
});

type DesktopNavbarProps = {
  onMenuClick: () => void;
};

export function DesktopNavbar({ onMenuClick }: DesktopNavbarProps) {
  const { isAuthenticated } = useAuth();
  const { handleCreateClick, handleMessagesClick, handleProfileClick } = useNavigationButtons();
  const navigate = useNavigate();

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "1.35rem !important",
          paddingBlock: "0.5rem",
        }}
      >
        <Stack direction="row" alignItems="center">
          <IconButton size="large" onClick={onMenuClick}>
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

        <Searchbar />

        {isAuthenticated ? (
          <Stack direction="row" alignItems="center">
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{
                color: "text.primary",
                borderRadius: "2rem",
                padding: "0.5rem 1rem",
                fontSize: "1rem",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
              }}
            >
              Create
            </Button>

            <IconButton size="large" onClick={handleMessagesClick}>
              <ChatIcon />
              <CustomBadge badgeContent={2} color="primary" overlap="circular" />
            </IconButton>

            <IconButton onClick={handleProfileClick}>
              <AccountCircleIcon style={{ fontSize: "2rem" }} />
              <CustomBadge badgeContent={10} color="primary" overlap="circular" />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" gap={1}>
            <AuthButton onClick={() => navigate({ to: "/login" })} variant="text">
              Login
            </AuthButton>
            <AuthButton onClick={() => navigate({ to: "/register" })} variant="contained">
              Sign up
            </AuthButton>
          </Stack>
        )}
      </Toolbar>
    </NavbarContainer>
  );
}
