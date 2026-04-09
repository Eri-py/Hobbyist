import { Stack } from "@mui/material";

type PostImageProps = {
  imageUrl: string;
};

export function PostImage({ imageUrl }: PostImageProps) {
  return (
    <Stack
      sx={{
        flex: 1,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderRadius: 1
      }} />
  );
}
