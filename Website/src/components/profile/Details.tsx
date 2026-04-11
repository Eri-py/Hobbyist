import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import Chip from "@mui/material/Chip";

type DetailsProps = {
  username: string;
  bio: string;
  hobbies: string[];
  tradeRatingOutOf100: number;
  tradeReviewCount: number;
};

export function Details({
  username,
  bio,
  hobbies,
  tradeRatingOutOf100,
  tradeReviewCount,
}: DetailsProps) {
  const visibleHobbies = hobbies.slice(0, 6);
  const tradeRatingStars = Math.round((tradeRatingOutOf100 / 20) * 2) / 2;

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack sx={{ gap: 0.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {username}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Rating value={tradeRatingStars} precision={0.5} readOnly size="small" />
          <Typography variant="caption" color="text.secondary">
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
