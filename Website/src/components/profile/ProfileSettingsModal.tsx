import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import Modal from "@mui/material/Modal";
import Slide from "@mui/material/Slide";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { DesktopProfileSettings } from "./settings/desktop/DesktopProfileSettings";
import { MobileProfileSettings } from "./settings/mobile/MobileProfileSettings";

type ProfileSettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

const desktopContainerStyles = {
  position: "absolute",
  inset: "50% auto auto 50%",
  transform: "translate(-50%, -50%)",
  width: "100%",
  maxWidth: 900,
  aspectRatio: 3 / 2,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 16,
};

const mobileContainerStyles = { position: "absolute", inset: 0, bgcolor: "background.paper" };

export function ProfileSettingsModal({ open, onClose }: ProfileSettingsModalProps) {
  const { isDesktop } = useDeviceType();

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      aria-labelledby="profile-settings-modal-title"
    >
      {isDesktop ? (
        <Fade in={open} timeout={180}>
          <Box sx={desktopContainerStyles}>
            <DesktopProfileSettings onClose={onClose} />
          </Box>
        </Fade>
      ) : (
        <Slide in={open} direction="left" timeout={220}>
          <Box sx={mobileContainerStyles}>
            <MobileProfileSettings onClose={onClose} />
          </Box>
        </Slide>
      )}
    </Modal>
  );
}
