import { useState } from "react";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { styled } from "@mui/material/styles";

import { useSidebar } from "@/hooks/app/useSidebar";

const StyledExpandedPrimary = styled(ListItemText)({
  "& .MuiListItemText-primary": {
    fontSize: "0.95rem",
    fontWeight: 300,
  },
});

const NavigationButton = styled(ListItemButton)({
  borderRadius: "0.5rem",
  gap: "0.75rem",
  height: "2.5rem",
});

export function HobbyNavigationButtons() {
  const { isSidebarOpen } = useSidebar();
  const [hobbiesExpanded, setHobbiesExpanded] = useState<boolean>(true);

  const hobbiesList = [
    "Vintage Baseball Cards",
    "Comic Book Collecting",
    "Coin Collecting",
    "Stamp Collecting",
    "Model Trains",
    "Pokemon Cards",
  ];

  const hobbies = hobbiesList.map((hobby) => (
    <NavigationButton key={hobby}>
      <StyledExpandedPrimary primary={hobby} />
    </NavigationButton>
  ));

  return (
    isSidebarOpen && (
      <>
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
    )
  );
}
