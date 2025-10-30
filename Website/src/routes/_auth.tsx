import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import Button from "@mui/material/Button";

import { LogoWithName } from "@/components/shared/Logo";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { FormContainer } from "@/components/auth/FormContainer";

export const Route = createFileRoute("/_auth")({
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
