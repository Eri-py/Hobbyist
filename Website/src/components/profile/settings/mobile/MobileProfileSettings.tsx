import { useCallback, useState } from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { type ProfileSettingsSectionId } from "@/hooks/profile/settings/useNavigation";
import { Header } from "./Header";
import { IdentityCard } from "./IdentityCard";
import { SectionNavButtons } from "./SectionNavButtons";

type MobileProfileSettingsProps = {
  onClose: () => void;
  activeSection: ProfileSettingsSectionId;
  onSectionClick: (sectionLabel: ProfileSettingsSectionId) => void;
};

type MobileSettingsView = "menu" | "section";

export function MobileProfileSettings({
  onClose,
  activeSection,
  onSectionClick,
}: MobileProfileSettingsProps) {
  const [view, setView] = useState<MobileSettingsView>("menu");

  const handleSectionSelect = useCallback(
    (sectionId: ProfileSettingsSectionId) => {
      onSectionClick(sectionId);
      setView("section");
    },
    [onSectionClick],
  );

  const handleBackToMenu = useCallback(() => {
    setView("menu");
  }, []);

  return (
    <Stack sx={{ height: "100%" }}>
      {view === "menu" ? (
        <Header view="menu" onClose={onClose} />
      ) : (
        <Header view="section" activeSection={activeSection} onBack={handleBackToMenu} />
      )}

      <Stack
        sx={{
          padding: 2,
          gap: 2,
          height: "100%",
        }}
      >
        {view === "menu" ? (
          <>
            <IdentityCard onClick={() => handleSectionSelect("identity")} />

            <SectionNavButtons activeSection={activeSection} onSectionClick={handleSectionSelect} />
          </>
        ) : (
          <Typography variant="h6">{activeSection}</Typography>
        )}
      </Stack>
    </Stack>
  );
}
