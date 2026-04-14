import type { ReactElement } from "react";

import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import ListItemButton from "@mui/material/ListItemButton";
import { styled } from "@mui/material/styles";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";

type SidebarProps = {
  onClose: () => void;
  activeSection: string;
  onSectionClick: (sectionLabel: string) => void;
};

type SectionItem = {
  label: string;
  icon: ReactElement;
  handleClick: () => void;
};

const SectionItemButton = styled(ListItemButton)({
  borderRadius: 8,
  gap: 4,
  height: 40,
});

const ExpandedIcon = styled(ListItemIcon)({
  minWidth: "fit-content",
});

const ExpandedLabel = styled(ListItemText)({
  "& .MuiListItemText-primary": {
    fontSize: 15,
    fontWeight: 300,
  },
});

export function Sidebar({ onClose, activeSection, onSectionClick }: SidebarProps) {
  const sectionItems: SectionItem[] = [
    {
      label: "Identity",
      icon: <PersonOutlineOutlinedIcon />,
      handleClick: () => {
        onSectionClick("identity");
      },
    },
    {
      label: "Appearance",
      icon: <PaletteOutlinedIcon />,
      handleClick: () => {
        onSectionClick("appearance");
      },
    },
    {
      label: "Interests",
      icon: <FavoriteBorderOutlinedIcon />,
      handleClick: () => {
        onSectionClick("interests");
      },
    },
    {
      label: "Social links",
      icon: <LinkOutlinedIcon />,
      handleClick: () => {
        onSectionClick("social-links");
      },
    },
  ];

  const sectionButtons = sectionItems.map((item) => {
    return (
      <SectionItemButton
        key={item.label}
        selected={item.label.toLowerCase() === activeSection}
        onClick={item.handleClick}
      >
        <ExpandedIcon>{item.icon}</ExpandedIcon>
        <ExpandedLabel primary={item.label} />
      </SectionItemButton>
    );
  });

  return (
    <Stack
      sx={{
        width: "100%",
        maxWidth: 210,
        borderRight: "1px solid red",
      }}
    >
      <Stack
        direction="row"
        sx={{
          padding: 2,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid red",
        }}
      >
        <Typography variant="subtitle1">Profile</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <List disablePadding sx={{ border: "1px solid yellow" }}>
        {sectionButtons}
      </List>
    </Stack>
  );
}
