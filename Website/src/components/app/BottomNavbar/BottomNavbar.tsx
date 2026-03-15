import Paper from "@mui/material/Paper";
import { alpha, useTheme } from "@mui/material/styles";

import { NavigationButtons } from "./NavigationButtons";

export function BottomNavbar() {
  const theme = useTheme();

  return (
    <Paper
      component="footer"
      elevation={0}
      sx={{
        backgroundColor: "background.default",
        borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      <NavigationButtons />
    </Paper>
  );
}
