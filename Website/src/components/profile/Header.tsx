import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

type HeaderProps = {
  avatarSize: number;
  avatarLeft: number;
  bannerHeight: number;
};

export function Header({ avatarSize, avatarLeft, bannerHeight }: HeaderProps) {
  return (
    <Stack
      sx={{
        position: "relative",
        border: "1px solid orange",
        mb: `calc(${avatarSize / 2}px)`,
      }}
    >
      <Stack
        sx={{
          height: bannerHeight,
          position: "relative",
        }}
      />

      <Avatar
        sx={{
          width: avatarSize,
          height: avatarSize,
          position: "absolute",
          zIndex: 2,
          left: avatarLeft,
          bottom: 0,
          transform: "translateY(50%)",
          boxShadow: 2,
          bgcolor: "background.paper",
        }}
      >
        <AccountCircleIcon sx={{ fontSize: avatarSize * 0.65 }} />
      </Avatar>
    </Stack>
  );
}
