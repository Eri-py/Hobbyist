import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import ChatIcon from "@mui/icons-material/Chat";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Stack from "@mui/material/Stack";
import Badge, { badgeClasses } from "@mui/material/Badge";
import { styled } from "@mui/material/styles";

import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";

const CustomBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -0.5rem;
    right: 0rem;
  }
`;

export function BottomNavbar() {
  const { handleCreateClick, handleProfileClick } = useNavigationButtons();

  return (
    <Stack
      direction="row"
      component="footer"
      height="3rem"
      justifyContent="space-between"
      position="sticky"
      sx={{
        backgroundColor: "background.default",
        bottom: 0,
        left: 0,
      }}
    >
      <IconButton size="large">
        <HomeIcon style={{ fontSize: "1.75rem" }} />
      </IconButton>

      <IconButton size="large">
        <StorefrontIcon style={{ fontSize: "1.75rem" }} />
      </IconButton>

      <IconButton size="large" onClick={handleCreateClick}>
        <AddIcon style={{ fontSize: "1.75rem" }} />
      </IconButton>

      <IconButton>
        <ChatIcon />
        <CustomBadge badgeContent={2} color="primary" overlap="circular" />
      </IconButton>

      <IconButton size="large" onClick={handleProfileClick}>
        <AccountCircleIcon style={{ fontSize: "1.75rem" }} />
      </IconButton>
    </Stack>
  );
}
