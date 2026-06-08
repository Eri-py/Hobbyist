import type { ReactElement } from "react";

import HomeIcon from "@mui/icons-material/Home";
import StoreIcon from "@mui/icons-material/Store";
import EventIcon from "@mui/icons-material/Event";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { styled } from "@mui/material/styles";

import { useNavigation, type DesktopNavbarItem } from "@/hooks/app/useNavigation";
import List from "@mui/material/List";

const NavItemButton = styled(ListItemButton)({
  borderRadius: 12,
  height: "auto",
  justifyContent: "center",
});

const NavLabel = styled(ListItemText)({
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

  const getDesktopIcon = (item: DesktopNavbarItem): ReactElement => {
    switch (item.key) {
      case "home":
        return <HomeIcon />;
      case "trade":
        return <StoreIcon />;
      case "events":
        return <EventIcon />;
    }
  };

  const navigationButtons = desktopItems.map((item) => {
    const isActive = getActiveTab(item.label);

    return (
      <NavItemButton key={item.label} selected={isActive} onClick={item.handleClick}>
        <NavLabel primary={getDesktopIcon(item)} secondary={item.label} />
      </NavItemButton>
    );
  });

  return (
    <List disablePadding sx={{ width: "100%" }}>
      {navigationButtons}
    </List>
  );
}
