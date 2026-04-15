import { useCallback, useState } from "react";

export type ProfileSettingsSectionId = "identity" | "appearance" | "interests" | "social-links";

export type ProfileSettingsSection = {
  id: ProfileSettingsSectionId;
  label: string;
  description: string;
};

export const PROFILE_SETTINGS_SECTIONS: ProfileSettingsSection[] = [
  {
    id: "identity",
    label: "Identity",
    description: "Username, location",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Photo, banner, and visual style",
  },
  {
    id: "interests",
    label: "Interests",
    description: "Hobbies and collecting focus",
  },
  {
    id: "social-links",
    label: "Social links",
    description: "Instagram, TikTok, and more",
  },
];

export function useNavigation(initialSection: ProfileSettingsSectionId = "identity") {
  const [activeSection, setActiveSection] = useState<ProfileSettingsSectionId>(initialSection);

  const onSectionClick = useCallback((sectionId: ProfileSettingsSectionId) => {
    setActiveSection(sectionId);
  }, []);

  const getActiveSection = useCallback(
    (sectionId: ProfileSettingsSectionId) => activeSection === sectionId,
    [activeSection],
  );

  return {
    activeSection,
    onSectionClick,
    getActiveSection,
  };
}
