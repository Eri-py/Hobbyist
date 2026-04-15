import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

type DetailsProps = {
  username: string;
  isOwnProfile: boolean;
  onProfileSettingsClick: () => void;
  bio: string;
  hobbies: string[];
  tradeRatingOutOf100: number;
  tradeReviewCount: number;
};

export function Details({
  username,
  isOwnProfile,
  onProfileSettingsClick,
  bio,
  hobbies,
  tradeRatingOutOf100,
  tradeReviewCount,
}: DetailsProps) {
  const { isDesktop } = useDeviceType();
  const visibleHobbies = hobbies.slice(0, 6);
  const tradeRatingStars = Math.round((tradeRatingOutOf100 / 20) * 2) / 2;

  return (
    <Stack sx={{ gap: 2, width: "100%" }}>
      <Stack sx={{ gap: 0.5 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant={isDesktop ? "h4" : "h5"} sx={{ fontWeight: 700 }}>
            {username}
          </Typography>

          {isOwnProfile && (
            <IconButton onClick={onProfileSettingsClick} aria-label="Open profile settings">
              <ManageAccountsIcon sx={{ fontSize: isDesktop ? "2rem" : "1.5rem" }} />
            </IconButton>
          )}
        </Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Rating
            value={tradeRatingStars}
            precision={0.5}
            readOnly
            size={isDesktop ? "medium" : "small"}
          />
          <Typography variant={isDesktop ? "body1" : "caption"} color="text.secondary">
            ({tradeReviewCount} reviews)
          </Typography>
        </Stack>
      </Stack>

      <Stack sx={{ gap: 0.75 }}>
        <Typography variant="body2" color="text.secondary">
          {bio}
        </Typography>
        <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap" }}>
          {visibleHobbies.map((hobby) => (
            <Chip key={hobby} label={hobby} size="small" variant="outlined" />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
