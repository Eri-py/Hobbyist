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
    fontSize: "0.95rem",
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
          borderRadius: isSidebarOpen ? "0.5rem" : "0.75rem",
          gap: isSidebarOpen ? "0.75rem" : 0,
          height: isSidebarOpen ? "2.5rem" : "auto",
          marginBottom: isSidebarOpen && isLastItem ? "0.5rem" : "0",
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
              maxHeight: "3.5rem",
              "& .MuiListItemText-secondary": {
                textAlign: "center",
                fontSize: "0.75rem",
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
