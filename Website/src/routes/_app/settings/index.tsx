import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { SETTINGS_SECTIONS } from "./-sections";

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsIndex,
});

function SettingsIndex() {
  const { isDesktop } = useDeviceType();
  const navigate = useNavigate();

  // Desktop always pairs the sidebar with a section, so default to Account.
  useEffect(() => {
    if (isDesktop) navigate({ to: "/settings/account", replace: true });
  }, [isDesktop, navigate]);

  if (isDesktop) return null;

  return (
    <List disablePadding>
      {SETTINGS_SECTIONS.map((section) => (
        <ListItemButton
          key={section.to}
          onClick={() => navigate({ to: section.to })}
          sx={{ gap: 2, px: 2, py: 1.75, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <ListItemIcon sx={{ minWidth: "fit-content", color: "text.secondary" }}>
            {section.icon}
          </ListItemIcon>
          <ListItemText
            primary={section.label}
            secondary={section.description}
            slotProps={{
              primary: { sx: { fontSize: 16, fontWeight: 600 } },
              secondary: { sx: { fontSize: 13, mt: 0.25 } },
            }}
          />
          <ChevronRightRoundedIcon sx={{ color: "text.secondary" }} />
        </ListItemButton>
      ))}
    </List>
  );
}
