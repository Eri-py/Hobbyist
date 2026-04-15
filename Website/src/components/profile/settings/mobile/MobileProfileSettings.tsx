import { useCallback, useMemo, useState } from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { type ProfileSettingsSectionId } from "@/hooks/profile/settings/useNavigation";
import { useHistoryLayer } from "@/hooks/shared/useHistoryLayer";
import { Header } from "./Header";
import { IdentityCard } from "./IdentityCard";
import { SectionNavButtons } from "./SectionNavButtons";
import { type SlideDirection, ViewSlideTransition } from "./ViewSlideTransition";

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
  const [direction, setDirection] = useState<SlideDirection>("forward");
  const sectionHistoryLayer = useHistoryLayer({
    stateKey: "profileSettingsSection",
    onPopOut: () => {
      setDirection("backward");
      setView("menu");
    },
  });

  const handleSectionSelect = useCallback(
    (sectionId: ProfileSettingsSectionId) => {
      onSectionClick(sectionId);
      sectionHistoryLayer.pushEntry();
      setDirection("forward");
      setView("section");
    },
    [onSectionClick, sectionHistoryLayer],
  );

  const handleBackToMenu = useCallback(() => {
    sectionHistoryLayer.popEntryOr(() => {
      setDirection("backward");
      setView("menu");
    });
  }, [sectionHistoryLayer]);

  const views = useMemo(
    () => ({
      menu: (
        <Stack sx={{ height: "100%" }}>
          <Header view="menu" onClose={onClose} />

          <Stack
            sx={{
              padding: 2,
              gap: 2,
              height: "100%",
            }}
          >
            <IdentityCard onClick={() => handleSectionSelect("identity")} />

            <SectionNavButtons activeSection={activeSection} onSectionClick={handleSectionSelect} />
          </Stack>
        </Stack>
      ),
      section: (
        <Stack sx={{ height: "100%" }}>
          <Header view="section" activeSection={activeSection} onBack={handleBackToMenu} />

          <Stack
            sx={{
              padding: 2,
              gap: 2,
              height: "100%",
            }}
          >
            <Typography variant="h6">{activeSection}</Typography>
          </Stack>
        </Stack>
      ),
    }),
    [activeSection, handleBackToMenu, handleSectionSelect, onClose],
  );

  return <ViewSlideTransition view={view} direction={direction} views={views} />;
}
