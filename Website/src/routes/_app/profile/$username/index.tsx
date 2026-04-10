import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile/ProfilePage";

export const Route = createFileRoute("/_app/profile/$username/")({
  component: UsernameProfilePage,
});

function UsernameProfilePage() {
  const { username } = Route.useParams();
  return <ProfilePage username={username} />;
}
