import Stack from "@mui/material/Stack";
import { Sidebar } from "./Sidebar";
import type { ProfileSettingsSectionId } from "@/hooks/profile/settings/useNavigation";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

type DesktopProfileSettingsProps = {
  onClose: () => void;
  activeSection: ProfileSettingsSectionId;
  onSectionClick: (sectionLabel: ProfileSettingsSectionId) => void;
};

export function DesktopProfileSettings({
  onClose,
  activeSection,
  onSectionClick,
}: DesktopProfileSettingsProps) {
  return (
    <Stack direction="row" sx={{ height: "100%" }}>
      <Sidebar onClose={onClose} onSectionClick={onSectionClick} activeSection={activeSection} />
      <Paper sx={{ width: "100%" }}>
        <Typography>{activeSection}</Typography>
      </Paper>
    </Stack>
  );
}
