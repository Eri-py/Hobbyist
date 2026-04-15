import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useMobileHeaderConfig } from "@/hooks/app/useMobileHeader";
import { useHistoryLayer } from "@/hooks/shared/useHistoryLayer";
import { useAuth } from "@hobbyist/hooks";
import { Header } from "@/components/profile/Header";
import { Details } from "@/components/profile/Details";
import { ProfileSettingsModal } from "@/components/profile/ProfileSettingsModal";

export const Route = createFileRoute("/_app/profile/$username/")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDesktop } = useDeviceType();
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const modalHistoryLayer = useHistoryLayer({
    stateKey: "profileSettingsModal",
    onPopOut: () => setIsProfileSettingsOpen(false),
  });
  const isOwnProfile = user?.username === username;

  const handleSettingsClick = useCallback(() => {
    navigate({ to: "/settings" });
  }, [navigate]);

  const handleProfileSettingsOpen = useCallback(() => {
    if (isProfileSettingsOpen) {
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    modalHistoryLayer.pushEntry();

    setIsProfileSettingsOpen(true);
  }, [isProfileSettingsOpen, modalHistoryLayer]);

  const handleProfileSettingsClose = useCallback(() => {
    if (!isProfileSettingsOpen) {
      return;
    }

    modalHistoryLayer.popEntryOr(() => {
      setIsProfileSettingsOpen(false);
    });
  }, [isProfileSettingsOpen, modalHistoryLayer]);

  const rightMobileHeaderSlot = useMemo(
    () => (
      <IconButton onClick={handleSettingsClick} aria-label="Open app settings">
        <SettingsIcon />
      </IconButton>
    ),
    [handleSettingsClick],
  );

  useMobileHeaderConfig({
    right: rightMobileHeaderSlot,
  });

  // Placeholder shape until profile backend data is wired.
  const avatarSize = isDesktop ? 108 : 82;
  const bannerHeight = isDesktop ? 200 : 120;
  const avatarLeft = isDesktop ? 24 : 12;
  const hobbyPlaceholders = [
    "Trading Cards",
    "Sneakers",
    "Comic Books",
    "Funko Pops",
    "Watches",
    "Coins",
  ];
  const profileBio = "Collector focused on fair trades, clear communication, and hobby posts.";
  const tradeRatingOutOf100 = 86;
  const tradeReviewCount = 42;

  return (
    <Stack
      sx={{
        flex: 1,
        overflow: "auto",
        padding: isDesktop ? 2 : 0,
      }}
    >
      <Stack
        sx={{
          overflow: "hidden",
        }}
      >
        <Header avatarSize={avatarSize} avatarLeft={avatarLeft} bannerHeight={bannerHeight} />

        <Stack
          sx={{
            px: isDesktop ? 3 : 0,
            gap: 2,
          }}
        >
          <Stack
            sx={{
              justifyContent: isDesktop ? "space-between" : undefined,
              alignItems: isDesktop ? "center" : undefined,
              gap: isDesktop ? 0 : 1,
            }}
            direction={isDesktop ? "row" : "column"}
          >
            <Details
              username={username}
              isOwnProfile={isOwnProfile}
              onProfileSettingsClick={handleProfileSettingsOpen}
              bio={profileBio}
              hobbies={hobbyPlaceholders}
              tradeRatingOutOf100={tradeRatingOutOf100}
              tradeReviewCount={tradeReviewCount}
            />
          </Stack>
        </Stack>
      </Stack>

      <Stack
        sx={{
          flex: 1,
          overflow: "auto",
          border: "1px solid yellow",
        }}
      />

      <ProfileSettingsModal open={isProfileSettingsOpen} onClose={handleProfileSettingsClose} />
    </Stack>
  );
}
