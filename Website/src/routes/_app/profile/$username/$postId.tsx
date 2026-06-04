import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_app/profile/$username/$postId")({
  head: ({ params }) => seo({ title: `Post by @${params.username}`, noindex: true }),
  component: UsernamePostPage,
});

function UsernamePostPage() {
  const { username, postId } = Route.useParams();

  return <ProfilePage username={username} openedPostId={postId} />;
}
