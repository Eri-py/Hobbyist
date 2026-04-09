import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import LocationOnIcon from "@mui/icons-material/LocationOn";

type ProfileInfoProps = {
  isSidebarOpen: boolean;
  username: string | null;
  location: string | null;
};

export function ProfileInfo({ isSidebarOpen, username, location }: ProfileInfoProps) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 1
      }}>
      <Avatar sx={{ width: 60, height: 60 }}>
        <AccountCircleIcon fontSize="large" />
      </Avatar>
      {isSidebarOpen && (
        <Stack>
          <Typography
            noWrap
            sx={{
              fontSize: 18,
              fontWeight: 600
            }}>
            {username}
          </Typography>

          {location ? (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                gap: 0.5
              }}>
              <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" noWrap sx={{
                color: "text.secondary"
              }}>
                {location}
              </Typography>
            </Stack>
          ) : (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                gap: 0.5
              }}>
              <LocationOffIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" noWrap sx={{
                color: "text.secondary"
              }}>
                No location set
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
