import { useNavigate } from "@tanstack/react-router";

import Badge, { badgeClasses } from "@mui/material/Badge";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ChatIcon from "@mui/icons-material/Chat";
import AddIcon from "@mui/icons-material/Add";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";
import { useAuth } from "@hobbyist/hooks";
import { useProfile } from "@/hooks/profile/useProfile";

const CustomBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -0.5rem;
    right: 0rem;
  }
`;

const AuthButton = styled(Button)({
  fontSize: 16,
  fontWeight: 400,
});

export function RightButtonGroup() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { handleProfileClick } = useProfile();
  const { handleCreateClick, handleMessagesClick } = useNavigationButtons();

  if (isAuthenticated) {
    return (
      <Stack direction="row" alignItems="center">
        <Button
          variant="text"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          sx={{
            color: "text.primary",
            borderRadius: 4,
            paddingBlock: 1,
            paddingInline: 2,
            fontSize: 16,
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
          <AccountCircleIcon style={{ fontSize: 32 }} />
          <CustomBadge badgeContent={10} color="primary" overlap="circular" />
        </IconButton>
      </Stack>
    );
  }
  return (
    <Stack direction="row" alignItems="center" gap={1.5}>
      <AuthButton onClick={() => navigate({ to: "/login" })} variant="text">
        Login
      </AuthButton>

      <AuthButton onClick={() => navigate({ to: "/sign-up" })} variant="outlined">
        Sign up
      </AuthButton>
    </Stack>
  );
}
