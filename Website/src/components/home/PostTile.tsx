import { Stack, Paper } from "@mui/material";
import { PostHeader } from "./PostHeader";
import { PostImage } from "./PostImage";
import { PostFooter } from "./PostFooter";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

export type Post = {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
  };
  condition: "Mint" | "Excellent" | "Good" | "Fair";
  tradable: boolean;
};

export function PostTile({ post }: { post: Post }) {
  const { isDesktop } = useDeviceType();

  const content = (
    <>
      <PostHeader
        userName={post.user.name}
        userAvatar={post.user.avatar}
        timestamp={post.timestamp}
        title={post.title}
      />

      <PostImage imageUrl={post.imageUrl} />

      <PostFooter
        likes={post.likes}
        comments={post.comments}
        shares={post.shares}
        condition={post.condition}
        tradable={post.tradable}
      />
    </>
  );

  if (isDesktop) {
    return (
      <Paper
        elevation={1}
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: { sm: 750 },
          gap: 1.5,
          padding: 2,
          aspectRatio: { xs: 7 / 9, sm: 9 / 8 },
        }}
      >
        {content}
      </Paper>
    );
  }

  return (
    <Stack
      width="100%"
      maxWidth={{ sm: 650 }}
      padding={2}
      gap={1.5}
      sx={{ aspectRatio: { xs: 7 / 9, sm: 9 / 8 } }}
    >
      {content}
    </Stack>
  );
}
