import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useAuth } from "@hobbyist/hooks";

export const Route = createFileRoute("/_app/profile/$username/")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const isOwnProfile = user?.username == username;

  return (
    <Stack
      sx={{
        padding: 1,
        gap: 3,
        flex: 1,
      }}
    >
      {isOwnProfile
        ? `${username} is viewing their profile`
        : `${username}'s profile is being viewed`}
    </Stack>
  );
}
