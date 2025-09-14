import { useEffect, useState, type ReactElement, type SetStateAction } from "react";
import { alpha, styled, useTheme } from "@mui/material/styles";

import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import HomeIcon from "@mui/icons-material/Home";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import EventIcon from "@mui/icons-material/Event";
import FormControlLabel from "@mui/material/FormControlLabel";

import { useThemeToggle } from "@/hooks/shared/useThemeToggle";
import { useLocation } from "@tanstack/react-router";
import { ThemeSwitch } from "./ThemeSwitch";
import { useSidebar } from "@/hooks/app/useSidebar";
import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";

// Currently supported sidbar tabs
const navigationItems: { label: string; icon: ReactElement }[] = [
  { label: "Home", icon: <HomeIcon /> },
  { label: "Trade", icon: <StorefrontIcon /> },
  { label: "Events", icon: <EventIcon /> },
];

// Dummy hobbies list. //TODO: Replace with actual API call
const hobbiesList = [
  "Vintage Baseball Cards",
  "Comic Book Collecting",
  "Coin Collecting",
  "Stamp Collecting",
  "Model Trains",
  "Pokemon Cards",
];

const NavigationButton = styled(ListItemButton)({
  borderRadius: "0.5rem",
  gap: "0.75rem",
  height: "2.5rem",
});

const StyledListItemIcon = styled(ListItemIcon)({
  minWidth: "fit-content",
});

const StyledExpandedPrimary = styled(ListItemText)({
  "& .MuiListItemText-primary": {
    fontSize: "0.95rem",
    fontWeight: 300,
  },
});

export function Sidebar() {
  const [hobbiesExpanded, setHobbiesExpanded] = useState<boolean>(true);
  const { mode, toggleTheme } = useThemeToggle();
  const { handleHomeClick, handleEventsClick, handleTradeClick } = useNavigationButtons();
  const { isSidebarOpen } = useSidebar();
  const theme = useTheme();

  // Get the current active tab based on the primary route
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("");
  useEffect(() => {
    const primaryRoute = location.pathname.split("/")[1] || "Home";
    setActiveTab(primaryRoute);
  }, [location.pathname]);

  // Handle navigation button clicks.
  const handleNavigationButtonClick = (label: SetStateAction<string>) => {
    switch (label) {
      case "Home":
        handleHomeClick();
        break;
      case "Trade":
        handleTradeClick();
        break;
      case "Events":
        handleEventsClick();
        break;
    }
  };

  const navigationElements = navigationItems.map((item, idx) => {
    const isActive = item.label.localeCompare(activeTab, undefined, { sensitivity: "base" }) === 0;
    // Collapsed sidebar view for navigation buttons
    if (!isSidebarOpen) {
      return (
        <ListItemButton
          key={item.label}
          sx={{
            borderRadius: "0.75rem",
          }}
          selected={isActive}
          onClick={() => handleNavigationButtonClick(item.label)}
        >
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
        </ListItemButton>
      );
    }

    // Expanded sidebar view for navigation buttons
    return (
      <NavigationButton
        key={item.label}
        sx={{ marginBottom: idx === navigationItems.length - 1 ? "0.5rem" : "0" }}
        selected={isActive}
        onClick={() => handleNavigationButtonClick(item.label)}
      >
        <StyledListItemIcon>{item.icon}</StyledListItemIcon>
        <StyledExpandedPrimary primary={item.label} />
      </NavigationButton>
    );
  });

  const hobbies = hobbiesList.map((hobby) => (
    <NavigationButton key={hobby}>
      <StyledExpandedPrimary primary={hobby} />
    </NavigationButton>
  ));

  return (
    <Stack
      width={isSidebarOpen ? "18.75rem" : "5.5rem"}
      justifyContent="space-between"
      sx={{
        borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        paddingInline: "0.5rem",
      }}
    >
      <List>
        {navigationElements}
        {isSidebarOpen && (
          <>
            <Divider />
            <NavigationButton
              sx={{ marginTop: "1rem" }}
              onClick={() => setHobbiesExpanded(!hobbiesExpanded)}
            >
              <ListItemText secondary="HOBBIES" />
              {hobbiesExpanded ? <ExpandLess /> : <ExpandMore />}
            </NavigationButton>
            <Collapse in={hobbiesExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {hobbies}
              </List>
            </Collapse>
          </>
        )}
      </List>

      <Stack component="footer" paddingBottom="1rem">
        <FormControlLabel
          control={<ThemeSwitch sx={{ m: 1 }} checked={mode === "dark"} onChange={toggleTheme} />}
          label={isSidebarOpen ? "Toggle theme" : ""}
          slotProps={{
            typography: {
              sx: {
                fontWeight: 300,
              },
            },
          }}
        />
      </Stack>
    </Stack>
  );
}
