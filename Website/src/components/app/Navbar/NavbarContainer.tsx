import { useDeviceType } from "@/hooks/shared/useDeviceType";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

export function NavbarContainer({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { isDesktop } = useDeviceType();

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        left: 0,
        zIndex: 1100,
        backgroundColor: "background.default",
        borderBottom: isDesktop
          ? `1px solid ${alpha(theme.palette.divider, 0.25)}`
          : `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        height: isDesktop ? 60 : 45,
      }}
    >
      {children}
    </Box>
  );
}
