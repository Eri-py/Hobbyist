import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import { useAuth } from "@hobbyist/hooks";

type ActionButtonsProps = {
  isOwnProfile: boolean;
  onEditProfileClick?: () => void;
  onSettingsClick?: () => void;
};

export function ActionButtons({
  isOwnProfile,
  onEditProfileClick,
  onSettingsClick,
}: ActionButtonsProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || !isOwnProfile) {
    return null;
  }

  return (
    <Stack direction="row" sx={{ flex: 1, gap: 2, maxWidth: 500, maxHeight: 40 }}>
      <Button variant="contained" sx={{ flex: 1 }} onClick={onEditProfileClick}>
        Edit profile
      </Button>

      <Button variant="contained" sx={{ flex: 1 }} onClick={onSettingsClick}>
        Settings
      </Button>
    </Stack>
  );
}
