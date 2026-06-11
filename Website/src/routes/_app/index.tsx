import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import Stack from "@mui/material/Stack";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useAuth } from "@hobbyist/hooks";
import { useNotifications } from "@/hooks/app/useNotifications";
import { PostTile, type Post } from "@/components/home/PostTile";
import { mockPosts } from "@/components/home/mockData";
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
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const { isAuthenticated } = useAuth();
  const { notify, dismiss } = useNotifications();

  // Prompt unauthenticated mobile visitors to log in; clears when they leave home or sign in.
  useEffect(() => {
    if (isAuthenticated || isDesktop) return;
    const id = notify({
      severity: "info",
      message: "Log in to interact with posts.",
      duration: null,
      action: { label: "Login", onClick: () => navigate({ to: "/login" }) },
      key: "login-prompt",
    });
    return () => dismiss(id);
  }, [isAuthenticated, isDesktop, notify, dismiss, navigate]);

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
    </Stack>
  );
}
