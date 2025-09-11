import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";

import { LogoWithName } from "@/components/shared/Logo";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { mainTheme } from "@/themes/mainTheme";
import { FormContainer } from "@/components/auth/FormContainer";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { isDesktop } = useBreakpoint();
  const desktopTheme = mainTheme(false);
  const navigate = useNavigate();

  const content = (
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
            top: "2rem",
            left: "3rem",
          }}
          onClick={() => navigate({ to: "/" })}
        >
          <LogoWithName size="large" color="white" />
        </Button>
      )}
      <Outlet />
    </FormContainer>
  );

  return isDesktop ? <ThemeProvider theme={desktopTheme}>{content}</ThemeProvider> : content;
}
