import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";

type MobileProfileSettingsProps = {
  onClose: () => void;
};

export function MobileProfileSettings({ onClose }: MobileProfileSettingsProps) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
      <Typography id="profile-settings-modal-title" variant="h6">
        Profile Settings
      </Typography>
      <IconButton onClick={onClose} aria-label="Close profile settings">
        <CloseIcon />
      </IconButton>
    </Stack>
  );
}
