import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

import { useNavigate } from "@tanstack/react-router";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type ProfileIdentityProps = {
  firstName: string;
  lastName: string;
  username: string;
  tradeRating: number;
  hobbies: string[];
  isOwnProfile: boolean;
};

export function ProfileIdentity({
  firstName,
  lastName,
  username,
  tradeRating,
  hobbies,
  isOwnProfile,
}: ProfileIdentityProps) {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const avatarSize = isDesktop ? 108 : 82;

  return (
    <Stack>
      <Stack
        sx={{
          height: isDesktop ? 240 : 120,
          backgroundImage: "url(https://picsum.photos/seed/profile-banner/1200/400)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <Stack
        direction="row"
        sx={{
          alignItems: "flex-start",
          gap: 1.5,
          px: isDesktop ? 3 : 2,
          pb: 1,
        }}
      >
        <Avatar
          sx={{
            width: avatarSize,
            height: avatarSize,
            mt: `-${avatarSize / 3}px`,
            flexShrink: 0,
            boxShadow: 2,
            bgcolor: "background.paper",
          }}
        >
          <AccountCircleIcon sx={{ fontSize: avatarSize * 0.65 }} />
        </Avatar>

        <Stack sx={{ flex: 1, gap: 0.75, pt: 1 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack>
              <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
                <Typography variant={isDesktop ? "h4" : "h5"} sx={{ fontWeight: 700 }}>
                  {firstName} {lastName}
                </Typography>
                <Stack
                  direction="row"
                  sx={{ alignItems: "center", gap: 0.25, color: "warning.main" }}
                >
                  <StarRoundedIcon sx={{ fontSize: isDesktop ? 21 : 16 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "warning.main",
                      fontSize: isDesktop ? 18 : 15,
                      pt: isDesktop ? 0.35 : 0.25,
                    }}
                  >
                    {(tradeRating / 20).toFixed(1)}
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant="body1" color="text.secondary">
                @{username}
              </Typography>
            </Stack>

            {isOwnProfile && isDesktop && (
              <IconButton onClick={() => navigate({ to: "/settings" })} aria-label="Open settings">
                <SettingsIcon sx={{ fontSize: "2rem" }} />
              </IconButton>
            )}
          </Stack>

          {isDesktop && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textTransform: "capitalize", letterSpacing: "0.05em" }}
            >
              {hobbies.join(" · ")}
            </Typography>
          )}
        </Stack>
      </Stack>

      {!isDesktop && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, pb: 1, textTransform: "capitalize", letterSpacing: "0.05em" }}
        >
          {hobbies.join(" · ")}
        </Typography>
      )}
    </Stack>
  );
}
