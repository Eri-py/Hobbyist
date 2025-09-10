import Stack from "@mui/material/Stack";

export function PostTile() {
  return (
    <Stack
      border="1px solid green" // This is for debugging.
      width={{ xs: 100, sm: 650 }}
      padding={1.5}
      gap={1}
      sx={{ aspectRatio: 9 / 8 }}
    >
      <Stack>This is the community</Stack>
      <Stack>This is the title of the post</Stack>
      <Stack>This is the image for the post</Stack>
      <Stack>Likes, comments, shares</Stack>
    </Stack>
  );
}
