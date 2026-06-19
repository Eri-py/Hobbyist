import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";

import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import { seo } from "@/lib/seo";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

import { SETTINGS_SECTIONS } from "./settings/-sections";

export const Route = createFileRoute("/_app/settings")({
  head: () => seo({ title: "Settings", noindex: true }),
  component: SettingsLayout,
});

function SettingsLayout() {
  const { isDesktop } = useDeviceType();
  const location = useLocation();
  const navigate = useNavigate();

  if (isDesktop) {
    return (
      <Stack direction="row" sx={{ flex: 1, overflow: "hidden" }}>
        <Stack
          sx={{
            flex: 1,
            backgroundColor: "background.default",
            borderRight: "1px solid",
            borderColor: "divider",
            px: 1,
            overflow: "auto",
          }}
        >
          <Typography sx={{ fontSize: 40, fontWeight: 700, px: 2, py: 2 }}>Settings</Typography>
          <List disablePadding sx={{ gap: 0.5, display: "flex", flexDirection: "column" }}>
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = location.pathname.startsWith(section.to);
              return (
                <ListItemButton
                  key={section.to}
                  selected={isActive}
                  onClick={() => navigate({ to: section.to })}
                  sx={{ borderRadius: 2, gap: 1, height: 40, p: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: "fit-content", color: "inherit" }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.label}
                    slotProps={{ primary: { sx: { fontSize: 15, fontWeight: 400 } } }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Stack>

        <Stack sx={{ flex: 3, overflow: "auto", backgroundColor: "background.default" }}>
          <Outlet />
        </Stack>
      </Stack>
    );
  }

  // Mobile: index shows the section list; a sub-page shows a back header + its content.
  const onIndex = location.pathname === "/settings" || location.pathname === "/settings/";
  const activeSection = SETTINGS_SECTIONS.find((section) =>
    location.pathname.startsWith(section.to),
  );

  return (
    <Stack sx={{ flex: 1, overflow: "hidden" }}>
      {onIndex ? (
        <Typography sx={{ fontSize: 30, fontWeight: 700, px: 2, py: 2 }}>Settings</Typography>
      ) : (
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, px: 1, py: 1.5 }}>
          <IconButton onClick={() => navigate({ to: "/settings" })} aria-label="Back to settings">
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{activeSection?.label}</Typography>
        </Stack>
      )}

      <Stack sx={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </Stack>
    </Stack>
  );
}
