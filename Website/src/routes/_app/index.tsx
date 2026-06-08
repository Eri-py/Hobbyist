import { createFileRoute } from "@tanstack/react-router";
import Stack from "@mui/material/Stack";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useAuth } from "@hobbyist/hooks";
import { PostTile, type Post } from "@/components/home/PostTile";
import { mockPosts } from "@/components/home/mockData";
import { LoginSnackbar } from "@/components/home/LoginSnackbar";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_app/")({
  head: () =>
    seo({
      description:
        "Hobbyist is a social trading platform for collectors. Browse posts, discover hobbies, and trade with trusted users.",
      path: "/",
    }),
  component: HomePage,
});

function HomePage() {
  const { isDesktop } = useDeviceType();
  const { isAuthenticated } = useAuth();

  return (
    <Stack>
      <Stack
        sx={{
          flex: 1,
          gap: isDesktop ? 3 : 0,
          alignItems: "center",
          overflow: "auto",
          padding: isDesktop ? 2 : 1,
        }}
      >
        {mockPosts.map((post: Post) => (
          <PostTile key={post.id} post={post} />
        ))}
      </Stack>
      {!isAuthenticated && !isDesktop && <LoginSnackbar />}
    </Stack>
  );
}
