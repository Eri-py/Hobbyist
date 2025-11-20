import { Stack, Chip, Typography } from "@mui/material";

type PostFooterProps = {
  likes: number;
  comments: number;
  shares: number;
  condition: string;
  tradable: boolean;
};

export function PostFooter({ likes, comments, shares, condition, tradable }: PostFooterProps) {
  return (
    <Stack gap={1.5}>
      {/* Condition & Tradable Tags */}
      <Stack direction="row" gap={1}>
        {condition && <Chip label={condition} color="primary" size="small" variant="outlined" />}
        {tradable && <Chip label="Tradable" color="primary" size="small" variant="outlined" />}
      </Stack>

      {/* Stats */}
      <Stack direction="row" gap={2}>
        <Typography variant="body2" color="text.secondary">
          {likes} Likes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {comments} Comments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {shares} Shares
        </Typography>
      </Stack>
    </Stack>
  );
}
