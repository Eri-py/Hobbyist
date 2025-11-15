import Stack from "@mui/material/Stack";
import { alpha, useTheme } from "@mui/material/styles";

import { NavigationButtons } from "./NavigationButtons";

export function BottomNavbar() {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      component="footer"
      height={52}
      justifyContent="space-between"
      position="sticky"
      paddingBlock={0.5}
      paddingInline={2}
      sx={{
        backgroundColor: "background.default",
        borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        bottom: 0,
        left: 0,
      }}
    >
      <NavigationButtons />
    </Stack>
  );
}
