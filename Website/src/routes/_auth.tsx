import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";

import { LogoWithName } from "@/shared/components/Logo";
import { useBreakpoint } from "@/shared/hooks/useBreakpoint";
import { mainTheme } from "@/shared/themes/mainTheme";
import { FormContainer } from "@/features/auth/components/FormContainer";
import { AuthLayoutContext } from "@/features/auth/hooks/useAuthLayout";

export const Route = createFileRoute("/_auth")({
  component: RouteComponent,
});

function RouteComponent() {
  const defaultTheme = useTheme();
  const { isSmOrLarger } = useBreakpoint();
  const desktopTheme = mainTheme(false); // Use light mode for desktop
  const theme = isSmOrLarger ? desktopTheme : defaultTheme;
  const navigate = useNavigate();

  const authContextValue = {
    theme: theme,
    isSmOrLarger: isSmOrLarger,
  };

  const content = (
    <FormContainer>
      {isSmOrLarger && (
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
      <AuthLayoutContext.Provider value={authContextValue}>
        <Outlet />
      </AuthLayoutContext.Provider>
    </FormContainer>
  );

  return isSmOrLarger ? <ThemeProvider theme={desktopTheme}>{content}</ThemeProvider> : content;
}
