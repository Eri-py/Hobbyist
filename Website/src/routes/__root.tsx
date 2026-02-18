import { createRootRoute, Outlet } from "@tanstack/react-router";
import CssBaseline from "@mui/material/CssBaseline";

import { CustomThemeProvider } from "@/providers/shared/CustomThemeProvider";
import { BreakpointProvider } from "@/providers/shared/BreakpointProvider";
import { AuthProvider } from "@/providers/app/AuthProvider";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <BreakpointProvider>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </BreakpointProvider>
    </CustomThemeProvider>
  );
}
