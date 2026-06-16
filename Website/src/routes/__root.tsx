import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import CssBaseline from "@mui/material/CssBaseline";

import { CustomThemeProvider } from "@/providers/shared/CustomThemeProvider";
import { BreakpointProvider } from "@/providers/shared/BreakpointProvider";
import { AuthProvider } from "@/providers/app/AuthProvider";
import { FeatureFlagsProvider } from "@/providers/root/FeatureFlagsProvider";
import { NotificationProvider } from "@/providers/app/NotificationProvider";
import { seo } from "@/lib/seo";

export const Route = createRootRoute({
  // Site-wide defaults; individual routes override title/description via their own `head`.
  head: () => seo(),
  component: Root,
});

function Root() {
  return (
    <CustomThemeProvider>
      <HeadContent />
      <CssBaseline />
      <BreakpointProvider>
        <NotificationProvider>
          <FeatureFlagsProvider>
            <AuthProvider>
              <Outlet />
            </AuthProvider>
          </FeatureFlagsProvider>
        </NotificationProvider>
      </BreakpointProvider>
    </CustomThemeProvider>
  );
}
