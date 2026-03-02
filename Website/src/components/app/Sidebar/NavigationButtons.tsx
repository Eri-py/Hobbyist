import type { ReactElement } from "react";

import HomeIcon from "@mui/icons-material/Home";
import StoreIcon from "@mui/icons-material/Store";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";

import { useSidebar } from "@/hooks/app/useSidebar";
import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";
import { useNavigation } from "@/hooks/app/useNavigation";

type NavigationItem = {
  label: string;
  icon: ReactElement;
  handleClick: () => void;
};

const NavigationContainer = styled(Stack)({
  gap: 8,
});

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
  const { handleHomeClick, handleTradeClick, handleEventsClick, handleSettingsClick } =
    useNavigationButtons();
  const { getActiveTab } = useNavigation();
  const { isSidebarOpen } = useSidebar();

  const navigationItems: NavigationItem[] = [
    { label: "Home", icon: <HomeIcon />, handleClick: handleHomeClick },
    { label: "Trade", icon: <StoreIcon />, handleClick: handleTradeClick },
    { label: "Events", icon: <EventIcon />, handleClick: handleEventsClick },
    { label: "Settings", icon: <SettingsIcon />, handleClick: handleSettingsClick },
  ];

  const navigationButtons = navigationItems.map((item) => {
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
            <ExpandedIcon>{item.icon}</ExpandedIcon>
            <ExpandedLabel primary={item.label} />
          </>
        ) : (
          <CollapsedLabel primary={item.icon} secondary={item.label} />
        )}
      </NavItemButton>
    );
  });

  return <NavigationContainer>{navigationButtons}</NavigationContainer>;
}
