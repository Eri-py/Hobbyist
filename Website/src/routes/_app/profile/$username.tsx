import { createFileRoute } from "@tanstack/react-router";

import { useAuth } from "@/hooks/app/useAuth";
import { useRouteSetup } from "@/hooks/app/useRouteSetup";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/profile/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: `Profile/${username}`,
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    [username]
  );
  useRouteSetup(routeConfig);

  const { user } = useAuth();
  const isOwnProfile = user?.username == username;

  return (
    <div>
      {isOwnProfile ? "User is viewing their profile" : `User is viewing ${username}'s profile`}
    </div>
  );
}
