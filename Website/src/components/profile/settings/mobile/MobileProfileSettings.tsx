import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { type ProfileSettingsSectionId } from "@/hooks/profile/settings/useNavigation";
import { IdentityCard } from "./IdentityCard";
import { SectionNavButtons } from "./SectionNavButtons";

type MobileProfileSettingsProps = {
  onClose: () => void;
  activeSection: ProfileSettingsSectionId;
  onSectionClick: (sectionLabel: ProfileSettingsSectionId) => void;
};

export function MobileProfileSettings({
  onClose,
  activeSection,
  onSectionClick,
}: MobileProfileSettingsProps) {
  return (
    <Stack sx={{ height: "100%" }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", border: "1px solid orange" }}
      >
        <Typography variant="h6">Settings</Typography>
        <IconButton onClick={onClose} size="large">
          <CloseIcon />
        </IconButton>
      </Stack>
      <Stack
        sx={{
          padding: 2,
          gap: 2,
          height: "100%",
          border: "1px solid yellow",
        }}
      >
        <IdentityCard onClick={() => onSectionClick("identity")} />

        <SectionNavButtons activeSection={activeSection} onSectionClick={onSectionClick} />
      </Stack>
    </Stack>
  );
}
