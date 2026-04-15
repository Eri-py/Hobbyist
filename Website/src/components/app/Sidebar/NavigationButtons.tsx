import type { ReactElement } from "react";

import HomeIcon from "@mui/icons-material/Home";
import StoreIcon from "@mui/icons-material/Store";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import { styled } from "@mui/material/styles";

import { useSidebar } from "@/hooks/app/useSidebar";
import { useNavigation, type DesktopNavbarItem } from "@/hooks/app/useNavigation";
import List from "@mui/material/List";

const NavItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== "isSidebarOpen",
})<{ isSidebarOpen: boolean }>(({ isSidebarOpen }) => ({
  borderRadius: isSidebarOpen ? 8 : 12,
  gap: isSidebarOpen ? 12 : 0,
  height: isSidebarOpen ? 40 : "auto",
}));

const ExpandedIcon = styled(ListItemIcon)({
  minWidth: "fit-content",
});

const ExpandedLabel = styled(ListItemText)({
  "& .MuiListItemText-primary": {
    fontSize: 15,
    fontWeight: 300,
  },
});

const CollapsedLabel = styled(ListItemText)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxHeight: 56,
  "& .MuiListItemText-secondary": {
    textAlign: "center",
    fontSize: 12,
  },
});

export function NavigationButtons() {
  const { desktopItems, getActiveTab } = useNavigation();
  const { isSidebarOpen } = useSidebar();

  const getDesktopIcon = (item: DesktopNavbarItem): ReactElement => {
    switch (item.key) {
      case "home":
        return <HomeIcon />;
      case "trade":
        return <StoreIcon />;
      case "events":
        return <EventIcon />;
      case "settings":
        return <SettingsIcon />;
    }
  };

  const navigationButtons = desktopItems.map((item) => {
    const isActive = getActiveTab(item.label);

    return (
      <NavItemButton
        key={item.label}
        isSidebarOpen={isSidebarOpen}
        selected={isActive}
        onClick={item.handleClick}
      >
        {isSidebarOpen ? (
          <>
            <ExpandedIcon>{getDesktopIcon(item)}</ExpandedIcon>
            <ExpandedLabel primary={item.label} />
          </>
        ) : (
          <CollapsedLabel primary={getDesktopIcon(item)} secondary={item.label} />
        )}
      </NavItemButton>
    );
  });

  return <List disablePadding>{navigationButtons}</List>;
}
