import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile/ProfilePage";

export const Route = createFileRoute("/_app/profile/$username/$postId")({
  component: UsernamePostPage,
});

function UsernamePostPage() {
  const { username, postId } = Route.useParams();

  return <ProfilePage username={username} openedPostId={postId} />;
}
