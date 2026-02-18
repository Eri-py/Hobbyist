import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import Button from "@mui/material/Button";
import { useEffect } from "react";

import { LogoWithName } from "@/components/shared/Logo";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { FormContainer } from "@/components/auth/FormContainer";
import { useAuth } from "@hobbyist/hooks";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { isDesktop } = useDeviceType();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users away from auth routes
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  // Don't render the form if user is authenticated
  if (isAuthenticated) {
    return null;
  }

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
