import type { ReactElement } from "react";

import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import ListItemButton from "@mui/material/ListItemButton";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";
import {
  PROFILE_SETTINGS_SECTIONS,
  type ProfileSettingsSectionId,
} from "@/hooks/profile/settings/useNavigation";

type SidebarProps = {
  onClose: () => void;
  activeSection: ProfileSettingsSectionId;
  onSectionClick: (sectionLabel: ProfileSettingsSectionId) => void;
};

type SectionItem = {
  id: ProfileSettingsSectionId;
  label: string;
  icon: ReactElement;
};

const getSectionIcon = (sectionId: ProfileSettingsSectionId): ReactElement => {
  switch (sectionId) {
    case "identity":
      return <PersonOutlineOutlinedIcon />;
    case "appearance":
      return <PaletteOutlinedIcon />;
    case "interests":
      return <FavoriteBorderOutlinedIcon />;
    case "social-links":
      return <LinkOutlinedIcon />;
  }
};

export function Sidebar({ onClose, activeSection, onSectionClick }: SidebarProps) {
  const sectionItems: SectionItem[] = PROFILE_SETTINGS_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    icon: getSectionIcon(section.id),
  }));

  const sectionButtons = sectionItems.map((item) => {
    return (
      <ListItemButton
        key={item.label}
        selected={item.id === activeSection}
        onClick={() => onSectionClick(item.id)}
        sx={{ borderRadius: 2, gap: 1, height: 40 }}
      >
        <ListItemIcon sx={{ minWidth: "fit-content" }}>{item.icon}</ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              sx: { fontSize: 15, fontWeight: 300 },
            },
          }}
        />
      </ListItemButton>
    );
  });

  return (
    <Stack
      sx={{
        width: "100%",
        maxWidth: 210,
        gap: 1,
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        sx={{
          padding: 2,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1">Profile</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <List disablePadding sx={{ paddingX: 0.5 }}>
        {sectionButtons}
      </List>
    </Stack>
  );
}
