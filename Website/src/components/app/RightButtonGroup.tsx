import { useNavigate } from "@tanstack/react-router";

import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Stack from "@mui/material/Stack";

import AddIcon from "@mui/icons-material/Add";

import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";
import { useAuth } from "@hobbyist/hooks";

const AuthButton = styled(Button)({
  fontSize: 16,
  fontWeight: 400,
});

export function RightButtonGroup() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { handleCreateClick } = useNavigationButtons();

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
          }}
        >
          Create
        </Button>
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
