import { alpha, useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import FormControlLabel from "@mui/material/FormControlLabel";

import { useThemeToggle } from "@/hooks/shared/useThemeToggle";
import { useSidebar } from "@/hooks/app/useSidebar";
import { ThemeSwitch } from "./ThemeSwitch";
import { NavigationButtons } from "./NavigationButtons";

export function Sidebar() {
  const { mode, toggleTheme } = useThemeToggle();
  const { isSidebarOpen } = useSidebar();
  const theme = useTheme();

  return (
    <Stack
      width={isSidebarOpen ? "18.75rem" : "5.5rem"}
      justifyContent="space-between"
      sx={{
        borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        paddingInline: "0.5rem",
      }}
    >
      <List>
        <NavigationButtons />
      </List>

      <Stack component="footer" paddingBottom="1rem">
        <FormControlLabel
          control={<ThemeSwitch sx={{ m: 1 }} checked={mode === "dark"} onChange={toggleTheme} />}
          label={isSidebarOpen ? "Toggle theme" : ""}
          slotProps={{ typography: { sx: { fontWeight: 300 } } }}
        />
      </Stack>
    </Stack>
  );
}
