import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";

import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import { seo } from "@/lib/seo";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import Typography from "@mui/material/Typography";

export const Route = createFileRoute("/_app/settings")({
  head: () => seo({ title: "Settings", noindex: true }),
  component: SettingsLayout,
});

type Tab = {
  label: string;
  to: string;
  icon: ReactNode;
};

const TABS: Tab[] = [
  { label: "Account", to: "/settings/account", icon: <ManageAccountsOutlinedIcon /> },
  { label: "Profile", to: "/settings/profile", icon: <PersonOutlineOutlinedIcon /> },
];

function SettingsLayout() {
  const { isDesktop } = useDeviceType();
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = TABS.findIndex((tab) => location.pathname.startsWith(tab.to));
  const activeTab = activeIndex === -1 ? 0 : activeIndex;

  if (isDesktop) {
    return (
      <Stack direction="row" sx={{ flex: 1, overflow: "hidden" }}>
        <Stack
          sx={{
            flex: 1,
            borderRight: "1px solid",
            borderColor: "divider",
            px: 1,
            overflow: "auto",
          }}
        >
          <Typography sx={{ fontSize: 40, fontWeight: 700, px: 2, py: 2 }}>Settings</Typography>
          <List disablePadding sx={{ gap: 0.5, display: "flex", flexDirection: "column" }}>
            {TABS.map((tab) => {
              const isActive = location.pathname.startsWith(tab.to);
              return (
                <ListItemButton
                  key={tab.to}
                  selected={isActive}
                  onClick={() => navigate({ to: tab.to })}
                  sx={{ borderRadius: 2, gap: 1, height: 40, p: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: "fit-content", color: "inherit" }}>
                    {tab.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={tab.label}
                    slotProps={{ primary: { sx: { fontSize: 15, fontWeight: 400 } } }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Stack>

        <Stack sx={{ flex: 3, overflow: "auto", backgroundColor: "background.paper" }}>
          <Outlet />
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack sx={{ flex: 1, overflow: "hidden" }}>
      <Typography sx={{ fontSize: 25, fontWeight: 700, px: 2, py: 2 }}>Settings</Typography>
      <Tabs value={activeTab} variant="scrollable" scrollButtons={false} sx={{ flexShrink: 0 }}>
        {TABS.map((tab) => (
          <Tab key={tab.to} label={tab.label} onClick={() => navigate({ to: tab.to })} />
        ))}
      </Tabs>

      <Stack sx={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </Stack>
    </Stack>
  );
}
