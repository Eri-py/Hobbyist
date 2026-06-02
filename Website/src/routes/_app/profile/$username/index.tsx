import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useMobileHeaderConfig } from "@/hooks/app/useMobileHeader";
import { useAuth } from "@hobbyist/hooks";
import { seo } from "@/lib/seo";
import { ProfileIdentity } from "@/components/profile/ProfileIdentity";
import { ProfilePostGrid } from "@/components/profile/ProfilePostGrid";
import { mockProfilePosts } from "@/components/profile/mockData";

export const Route = createFileRoute("/_app/profile/$username/")({
  head: ({ params }) => seo({ title: `@${params.username}`, noindex: true }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDesktop } = useDeviceType();
  const isOwnProfile = user?.username === username;

  const rightMobileHeaderSlot = useMemo(
    () =>
      isOwnProfile ? (
        <IconButton onClick={() => navigate({ to: "/settings" })} aria-label="Open settings">
          <SettingsIcon />
        </IconButton>
      ) : null,
    [isOwnProfile, navigate],
  );

  useMobileHeaderConfig({ right: rightMobileHeaderSlot });

  // Placeholder shape until profile backend data is wired.
  const hobbyPlaceholders = [
    "trading cards",
    "sneakers",
    "comic books",
    "funko pops",
    "watches",
    "coins",
  ];

  return (
    <Stack
      sx={{
        flex: 1,
        overflow: "auto",
        padding: isDesktop ? 2 : 0,
      }}
    >
      <ProfileIdentity
        firstName="Jordan"
        lastName="Miller"
        username={username}
        tradeRating={86}
        hobbies={hobbyPlaceholders}
        isOwnProfile={isOwnProfile}
      />

      <Tabs
        value={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
          "& .MuiTabs-flexContainer": { justifyContent: "flex-end" },
        }}
      >
        <Tab label="Posts" />
        {isOwnProfile && <Tab label="Drafts" />}
      </Tabs>

      <ProfilePostGrid posts={mockProfilePosts} />
    </Stack>
  );
}
