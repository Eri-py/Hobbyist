import Stack from "@mui/material/Stack";
import { alpha, useTheme } from "@mui/material/styles";

export function RightSidebar() {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        height: "100%",
        p: 2,
        gap: 2,
        borderLeft: `1px solid ${alpha(theme.palette.divider, 0.25)}`,
      }}
    />
  );
}
