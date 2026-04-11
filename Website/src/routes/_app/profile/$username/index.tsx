import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useAuth } from "@hobbyist/hooks";
import { Header } from "@/components/profile/Header";
import { Details } from "@/components/profile/Details";
import { ActionButtons } from "@/components/profile/ActionButtons";

export const Route = createFileRoute("/_app/profile/$username/")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const { isDesktop } = useDeviceType();
  const isOwnProfile = user?.username === username;

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
              bio={profileBio}
              hobbies={hobbyPlaceholders}
              tradeRatingOutOf100={tradeRatingOutOf100}
              tradeReviewCount={tradeReviewCount}
            />
            <ActionButtons isOwnProfile={isOwnProfile} />
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
    </Stack>
  );
}
