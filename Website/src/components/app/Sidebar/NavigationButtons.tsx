import type { ReactElement } from "react";

import HomeIcon from "@mui/icons-material/Home";
import StoreIcon from "@mui/icons-material/Store";
import EventIcon from "@mui/icons-material/Event";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import { styled } from "@mui/material/styles";

import { useSidebar } from "@/hooks/app/useSidebar";
import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";
import { useNavigation } from "@/hooks/app/useNavigation";

const CollapsedIcon = styled(ListItemIcon)({
  minWidth: "fit-content",
});

const ExpandedText = styled(ListItemText)({
  "& .MuiListItemText-primary": {
    fontSize: 15,
    fontWeight: 300,
  },
});

type NavigationItem = {
  label: string;
  icon: ReactElement;
  handleClick: () => void;
};

export function NavigationButtons() {
  const { handleHomeClick, handleTradeClick, handleEventsClick } = useNavigationButtons();
  const { getActiveTab } = useNavigation();
  const { isSidebarOpen } = useSidebar();

  const navigationItems: NavigationItem[] = [
    { label: "Home", icon: <HomeIcon />, handleClick: handleHomeClick },
    { label: "Trade", icon: <StoreIcon />, handleClick: handleTradeClick },
    { label: "Events", icon: <EventIcon />, handleClick: handleEventsClick },
  ];

  const navigationButtons = navigationItems.map((item, idx) => {
    const isActive = getActiveTab(item.label);
    const isLastItem = idx === navigationItems.length - 1;

    return (
      <ListItemButton
        key={item.label}
        sx={{
          borderRadius: isSidebarOpen ? 1 : 1.5,
          gap: isSidebarOpen ? 1.5 : 0,
          height: isSidebarOpen ? 40 : "auto",
          marginBottom: isSidebarOpen && isLastItem ? 1 : "0",
        }}
        selected={isActive}
        onClick={item.handleClick}
      >
        {isSidebarOpen ? (
          <>
            <CollapsedIcon>{item.icon}</CollapsedIcon>
            <ExpandedText primary={item.label} />
          </>
        ) : (
          <ListItemText
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxHeight: 56,
              "& .MuiListItemText-secondary": {
                textAlign: "center",
                fontSize: 12,
              },
            }}
            primary={item.icon}
            secondary={item.label}
          />
        )}
      </ListItemButton>
    );
  });

  return navigationButtons;
}
