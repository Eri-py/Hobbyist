import Box from "@mui/material/Box";

import type { ProfilePost } from "./mockData";

type ProfilePostGridProps = {
  posts: ProfilePost[];
};

export function ProfilePostGrid({ posts }: ProfilePostGridProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(auto-fill, minmax(150px, 1fr))", md: "repeat(auto-fill, minmax(400px, 1fr))" },
        gap: 1,
        width: "100%",
      }}
    >
      {posts.map((post) => (
        <Box
          key={post.id}
          sx={{
            aspectRatio: "1 / 1",
            backgroundImage: `url(${post.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
    </Box>
  );
}
