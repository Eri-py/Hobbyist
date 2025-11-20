import { Stack } from "@mui/material";

type PostImageProps = {
  imageUrl: string;
};

export function PostImage({ imageUrl }: PostImageProps) {
  return (
    <Stack
      flex={1}
      sx={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderRadius: 1,
      }}
    />
  );
}
