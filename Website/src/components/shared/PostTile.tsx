import Stack from "@mui/material/Stack";

export function PostTile() {
  return (
    <Stack
      border="1px solid red" // This is for debugging.
      width="100%"
      maxWidth={{ sm: 650 }}
      padding={1.5}
      gap={1}
      sx={{ aspectRatio: { xs: 8 / 9, sm: 9 / 8 } }}
    >
      <Stack border="1px solid orange">Community</Stack>
      <Stack border="1px solid yellow">Title</Stack>
      <Stack flex={1} border="1px solid green">
        {"Image(s)"}
      </Stack>
      <Stack border="1px solid blue">Likes, comments, shares</Stack>
    </Stack>
  );
}
