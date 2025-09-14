import { createRootRoute, Outlet } from "@tanstack/react-router";
import CssBaseline from "@mui/material/CssBaseline";

import { CustomThemeProvider } from "@/providers/shared/CustomThemeProvider";
import { BreakpointProvider } from "@/providers/shared/BreakpointProvider";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <BreakpointProvider>
        <Outlet />
      </BreakpointProvider>
    </CustomThemeProvider>
  );
}
