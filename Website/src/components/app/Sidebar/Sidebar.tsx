import { alpha, useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";

import { useThemeToggle } from "@/hooks/shared/useThemeToggle";
import { useSidebar } from "@/hooks/app/useSidebar";
import { ThemeSwitch } from "./ThemeSwitch";
import { NavigationButtons } from "./NavigationButtons";
import { ProfileInfo } from "./ProfileInfo";
import { useAuth } from "@hobbyist/hooks";

export function Sidebar() {
  const { mode, toggleTheme } = useThemeToggle();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const theme = useTheme();
  const { user } = useAuth();

  const username = user?.username ?? null;
  const location = null;

  return (
    <Stack
      width="100%"
      height="100%"
      position="relative"
      justifyContent="space-between"
      borderRight={`1px solid ${alpha(theme.palette.divider, 0.25)}`}
      paddingInline={isSidebarOpen ? 1.5 : 1}
      paddingBlock={1.5}
    >
      <Tooltip title="" placement="right">
        <IconButton
          size="small"
          onClick={toggleSidebar}
          sx={{
            position: "absolute",
            right: 0,
            transform: "translate(50%, 150%)",
            zIndex: 2,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `1px solid ${alpha(theme.palette.text.primary, 0.4)}`,
            color: "text.primary",
            bgcolor: alpha(theme.palette.background.default, 0.9),
            "&:hover": {
              bgcolor: alpha(theme.palette.background.paper, 0.95),
            },
          }}
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>

      <Stack gap={4} alignItems={isSidebarOpen ? undefined : "center"}>
        <ProfileInfo isSidebarOpen={isSidebarOpen} username={username} location={location} />

        {/* Main sidebar routes */}
        <List disablePadding>
          <NavigationButtons />
        </List>
      </Stack>

      <Stack component="footer" paddingBottom={2}>
        <FormControlLabel
          control={<ThemeSwitch sx={{ m: 1 }} checked={mode === "dark"} onChange={toggleTheme} />}
          label={isSidebarOpen ? "Toggle theme" : ""}
          slotProps={{ typography: { sx: { fontWeight: 300 } } }}
        />
      </Stack>
    </Stack>
  );
}
