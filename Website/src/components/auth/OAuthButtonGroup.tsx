import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import { GoogleIcon } from "@/components/shared/CustomIcons";
import Button from "@mui/material/Button";

export function OAuthButtonGroup() {
  const theme = useTheme();

  return (
    <Stack gap=".75rem">
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Divider sx={{ flexGrow: 1 }} />
        <Typography
          variant="body2"
          sx={{
            mx: ".5rem",
            color: theme.palette.text.secondary,
            fontSize: "0.875rem",
          }}
        >
          or
        </Typography>
        <Divider sx={{ flexGrow: 1 }} />
      </Box>

      <Button variant="outlined" size="large" type="button" sx={{ gap: 1 }}>
        <GoogleIcon width="1.5rem" />
        <Typography color="textPrimary">Sign up with Google</Typography>
      </Button>

      <Divider sx={{ borderColor: theme.palette.divider }} />
    </Stack>
  );
}
