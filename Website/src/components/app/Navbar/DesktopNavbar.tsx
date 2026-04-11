import { useNavigate } from "@tanstack/react-router";

import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";

import { useAuth } from "@hobbyist/hooks";
import { LogoWithName } from "@/components/shared/Logo";
import { NavbarContainer } from "./NavbarContainer";
import { useFeatureFlags } from "@hobbyist/hooks";
import { FeatureFlags } from "@hobbyist/types";

const AuthButton = styled(Button)({
  fontSize: 16,
  fontWeight: 400,
});

export function DesktopNavbar() {
  const flags = useFeatureFlags();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "1.35rem !important",
          paddingBlock: 1,
        }}
      >
        {/* Left: Logo */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
          }}
        >
          <Button
            variant="text"
            disableRipple
            onClick={() => navigate({ to: "/" })}
            sx={{
              "&:hover": {
                background: "none",
              },
            }}
          >
            <LogoWithName size="medium" />
          </Button>
        </Stack>

        {/* Center: Search Bar */}
        {flags[FeatureFlags.Search] && (
          <TextField
            placeholder="Search"
            size="small"
            sx={{ width: { lg: 360, xl: 700 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}

        {/* Right: Auth or Create Button */}
        {isAuthenticated ? (
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
            }}
          >
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={() => navigate({ to: "/create" })}
              sx={{
                color: "text.primary",
                borderRadius: 4,
                paddingBlock: 1,
                paddingInline: 2,
                fontSize: 16,
              }}
            >
              Create
            </Button>
          </Stack>
        ) : (
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <AuthButton onClick={() => navigate({ to: "/login" })} variant="text">
              Login
            </AuthButton>

            <AuthButton onClick={() => navigate({ to: "/sign-up" })} variant="outlined">
              Sign up
            </AuthButton>
          </Stack>
        )}
      </Toolbar>
    </NavbarContainer>
  );
}
