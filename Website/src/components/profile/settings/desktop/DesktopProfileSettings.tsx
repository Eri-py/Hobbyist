import Stack from "@mui/material/Stack";
import { Sidebar } from "./Sidebar";
import { useState } from "react";

type DesktopProfileSettingsProps = {
  onClose: () => void;
};

export function DesktopProfileSettings({ onClose }: DesktopProfileSettingsProps) {
  const [activeSection, setActiveSection] = useState<string>("identity");

  const onSectionClick = (sectionLabel: string) => {
    setActiveSection(sectionLabel);
  };

  return (
    <Stack direction="row" sx={{ height: "100%" }}>
      <Sidebar onClose={onClose} onSectionClick={onSectionClick} activeSection={activeSection} />
      <Stack sx={{ width: "100%", border: "1px solid orange" }}></Stack>
    </Stack>
  );
}
