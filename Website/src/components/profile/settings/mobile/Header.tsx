import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  PROFILE_SETTINGS_SECTIONS,
  type ProfileSettingsSectionId,
} from "@/hooks/profile/settings/useNavigation";

type HeaderProps =
  | {
      view: "menu";
      onClose: () => void;
    }
  | {
      view: "section";
      activeSection: ProfileSettingsSectionId;
      onBack: () => void;
    };

export function Header(props: HeaderProps) {
  const activeSectionLabel =
    props.view === "section"
      ? (PROFILE_SETTINGS_SECTIONS.find((section) => section.id === props.activeSection)?.label ??
        props.activeSection)
      : null;

  if (props.view === "menu") {
    return (
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          padding: 2,
        }}
      >
        <Typography variant="h6">Settings</Typography>
        <IconButton onClick={props.onClose} sx={{ padding: 0 }}>
          <CloseIcon />
        </IconButton>
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        padding: 2,
      }}
    >
      <IconButton onClick={props.onBack} sx={{ padding: 0 }}>
        <ArrowBackRoundedIcon />
      </IconButton>
      <Typography
        variant="h6"
        sx={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
      >
        {activeSectionLabel}
      </Typography>
      <Box />
    </Stack>
  );
}
