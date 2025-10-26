import { useAuth } from "@/hooks/app/useAuth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/profile/$username/settings")({
  component: UserSettingsPage,
});

function UserSettingsPage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const isOwnProfile = user?.username == username;
  return (
    <div>
      {isOwnProfile
        ? "User is trying to edit some of their settings"
        : "THIS IS NOT MEANT TO HAPPEN. TODO: REDIRECT USER TO EITHER THEIR OWN SETTING OR ERROR?"}
    </div>
  );
}
