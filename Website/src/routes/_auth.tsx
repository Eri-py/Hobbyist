import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import Button from "@mui/material/Button";

import { LogoWithName } from "@/components/shared/Logo";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { FormContainer } from "@/components/auth/FormContainer";
import { getUserDetails } from "@/api/AuthApi";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    try {
      const response = await getUserDetails();
      if (response.data.isAuthenticated) {
        throw redirect({ to: "/" });
      }
    } catch {
      // If auth check fails, stay on auth page
      return;
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();

  return (
    <FormContainer>
      {isDesktop && (
        <Button
          variant="text"
          disableRipple
          sx={{
            "&:hover": {
              background: "none",
            },
            position: "absolute",
            top: 32,
            left: 48,
          }}
          onClick={() => navigate({ to: "/" })}
        >
          <LogoWithName size="large" color="white" />
        </Button>
      )}
      <Outlet />
    </FormContainer>
  );
}
