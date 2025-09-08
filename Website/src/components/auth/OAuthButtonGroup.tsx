import { styled, useTheme } from "@mui/material/styles";
import AppleIcon from "@mui/icons-material/Apple";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

import { FacebookIcon, GoogleIcon } from "@/shared/components/CustomIcons";

const CustomIconButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.palette.primary.main}`,
}));

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

      <Stack direction="row" gap="1rem" alignSelf="center">
        <CustomIconButton size="large" disableRipple>
          <GoogleIcon width="2rem" />
        </CustomIconButton>
        <CustomIconButton size="large" disableRipple>
          <AppleIcon
            fontSize="large"
            sx={{
              color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
            }}
          />
        </CustomIconButton>
        <CustomIconButton size="large" disableRipple>
          <FacebookIcon width="2rem" />
        </CustomIconButton>
      </Stack>

      <Divider sx={{ borderColor: theme.palette.divider }} />
    </Stack>
  );
}
