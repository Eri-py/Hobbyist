import { Stack, Avatar, Typography } from "@mui/material";

type PostHeaderProps = {
  userName: string;
  userAvatar?: string;
  timestamp: string;
  title: string;
};

export function PostHeader({ userName, userAvatar, timestamp, title }: PostHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Avatar src={userAvatar} sx={{ bgcolor: "primary.main" }}>
          {getInitials(userName)}
        </Avatar>
        <Stack flex={1}>
          <Typography variant="body1" fontWeight="600">
            {userName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {timestamp}
          </Typography>
        </Stack>
      </Stack>

      <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
        {title}
      </Typography>
    </Stack>
  );
}
