import { type ReactElement } from "react";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import {
  PROFILE_SETTINGS_SECTIONS,
  type ProfileSettingsSectionId,
} from "@/hooks/profile/settings/useNavigation";

type SectionNavButtonsProps = {
  activeSection: ProfileSettingsSectionId;
  onSectionClick: (sectionLabel: ProfileSettingsSectionId) => void;
};

type SectionItem = {
  id: ProfileSettingsSectionId;
  label: string;
  description: string;
  icon: ReactElement;
};

const getSectionIcon = (sectionId: ProfileSettingsSectionId): ReactElement => {
  switch (sectionId) {
    case "appearance":
      return <PaletteOutlinedIcon />;
    case "interests":
      return <FavoriteBorderOutlinedIcon />;
    case "social-links":
      return <LinkOutlinedIcon />;
    default:
      return <></>;
  }
};

export function SectionNavButtons({ activeSection, onSectionClick }: SectionNavButtonsProps) {
  const sectionItems: SectionItem[] = PROFILE_SETTINGS_SECTIONS.filter(
    (section) => section.id !== "identity",
  ).map((section) => ({
    id: section.id,
    label: section.label,
    description: section.description,
    icon: getSectionIcon(section.id),
  }));

  return (
    <List disablePadding sx={{ border: "1px solid indigo" }}>
      {sectionItems.map((item) => (
        <ListItemButton
          key={item.label}
          aria-current={item.id === activeSection ? "page" : undefined}
          onClick={() => onSectionClick(item.id)}
          sx={{ borderRadius: 3, gap: 1.25, padding: "10px 12px" }}
        >
          <ListItemIcon
            sx={{
              padding: 1,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            secondary={item.description}
            slotProps={{
              primary: {
                sx: { fontSize: 15, fontWeight: 600, lineHeight: 1.2 },
              },
              secondary: {
                sx: {
                  mt: 0.5,
                  fontSize: 12,
                  lineHeight: 1.2,
                  color: "text.secondary",
                },
              },
            }}
          />
          <ChevronRightRoundedIcon sx={{ color: "text.secondary" }} />
        </ListItemButton>
      ))}
    </List>
  );
}
