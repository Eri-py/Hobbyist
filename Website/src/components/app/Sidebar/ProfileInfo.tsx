import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

type ProfileInfoProps = {
  isSidebarOpen: boolean;
  username: string | null;
  location: string | null;
};

export function ProfileInfo({ isSidebarOpen, username, location }: ProfileInfoProps) {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Avatar sx={{ width: 60, height: 60 }}>
        <AccountCircleIcon fontSize="large" />
      </Avatar>

      {isSidebarOpen && (
        <Stack>
          <Typography fontSize={14} fontWeight={600} noWrap>
            {username}
          </Typography>

          <Stack direction="row" alignItems="center" gap={0.5} minWidth={0}>
            <PlaceOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {location}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
