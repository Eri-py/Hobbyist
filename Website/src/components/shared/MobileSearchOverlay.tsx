import type { ReactNode } from "react";

import Modal from "@mui/material/Modal";

type MobileSearchOverlayProps = {
  children: ReactNode;
  isOpen: boolean;
};

export function MobileSearchOverlay({ children, isOpen }: MobileSearchOverlayProps) {
  return (
    <Modal
      open={isOpen}
      disableEnforceFocus
      sx={{ border: "5px solid green", backgroundColor: "background.default" }}
    >
      <>{children}</>
    </Modal>
  );
}
