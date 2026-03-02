import type { ReactNode } from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type CreateFormHeaderProps = {
  title?: string;
  subtitle?: string;
  rightAction?: ReactNode;
};

export function CreateFormHeader({
  title = "Create post",
  subtitle = "Showcase your collectible.",
  rightAction,
}: CreateFormHeaderProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Stack>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>
      {rightAction}
    </Stack>
  );
}
