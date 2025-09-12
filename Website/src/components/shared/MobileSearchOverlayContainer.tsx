import type { ReactNode } from "react";

import Modal from "@mui/material/Modal";

type MobileSearchOverlayProps = {
  children: ReactNode;
  isOpen: boolean;
};

export function MobileSearchOverlayContainer({ children, isOpen }: MobileSearchOverlayProps) {
  return (
    <Modal open={isOpen} sx={{ backgroundColor: "background.paper" }}>
      <div>{children}</div>
    </Modal>
  );
}
