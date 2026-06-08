import { alpha, useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";

import { useThemeToggle } from "@/hooks/shared/useThemeToggle";
import { ThemeSwitch } from "./ThemeSwitch";
import { NavigationButtons } from "./NavigationButtons";
import { ProfileInfo } from "./ProfileInfo";
import { useAuth } from "@hobbyist/hooks";

export function LeftSidebar() {
  const { mode, toggleTheme } = useThemeToggle();
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();

  const username = user?.username ?? null;

  return (
    <Stack
      sx={{
        width: "100%",
        height: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.25)}`,
        paddingInline: 1,
        paddingBlock: 1.5,
      }}
    >
      <Stack sx={{ gap: 2, alignItems: "center", width: "100%" }}>
        {isAuthenticated && <ProfileInfo username={username} />}
        <NavigationButtons />
      </Stack>

      <Stack component="footer" sx={{ paddingBottom: 2 }}>
        <ThemeSwitch checked={mode === "dark"} onChange={toggleTheme} />
      </Stack>
    </Stack>
  );
}
