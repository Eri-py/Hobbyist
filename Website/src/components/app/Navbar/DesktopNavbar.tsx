import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";

import { LogoWithName } from "@/components/shared/Logo";
import { RightButtonGroup } from "@/components/app/RightButtonGroup";
import { NavbarContainer } from "./NavbarContainer";

export function DesktopNavbar() {
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
        <Stack direction="row" alignItems="center">
          <Button
            variant="text"
            disableRipple
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

        {/* Right: Buttons */}
        <RightButtonGroup />
      </Toolbar>
    </NavbarContainer>
  );
}
