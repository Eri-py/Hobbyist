import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useProfile } from "@/hooks/profile/useProfile";
import IconButton from "@mui/material/IconButton";

type ProfileInfoProps = {
  isSidebarOpen: boolean;
  username: string | null;
  location: string | null;
};

export function ProfileInfo({ isSidebarOpen, username, location }: ProfileInfoProps) {
  const { handleProfileClick } = useProfile();
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 1,
      }}
    >
      <IconButton onClick={handleProfileClick}>
        <Avatar sx={{ width: 60, height: 60 }}>
          <AccountCircleIcon fontSize="large" />
        </Avatar>
      </IconButton>

      {isSidebarOpen && (
        <Stack>
          <Typography
            noWrap
            sx={{
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {username}
          </Typography>

          {location ? (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: "text.secondary",
                }}
              >
                {location}
              </Typography>
            </Stack>
          ) : (
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <LocationOffIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: "text.secondary",
                }}
              >
                No location set
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
