import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Badge, { badgeClasses } from "@mui/material/Badge";
import { alpha, styled, useTheme } from "@mui/material/styles";

import { useBottomNavbarContent } from "./useBottomNavbarContent";
import { useActiveTab } from "@/hooks/shared/useActiveTab";

const CustomBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -0.5rem;
    right: 0rem;
  }
`;

export function BottomNavbar() {
  const theme = useTheme();
  const { bottomNavbarContent } = useBottomNavbarContent();
  const { getActiveTab } = useActiveTab();

  const content = bottomNavbarContent.map((item) => {
    const isActive = getActiveTab(item.label);

    return (
      <IconButton size="large" onClick={item.handleClick} key={item.label}>
        {isActive ? item.activeIcon : item.icon}
        {item.notifications && (
          <CustomBadge badgeContent={item.notifications} color="primary" overlap="circular" />
        )}
      </IconButton>
    );
  });

  return (
    <Stack
      direction="row"
      component="footer"
      height="3rem"
      justifyContent="space-between"
      position="sticky"
      sx={{
        backgroundColor: "background.default",
        borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        bottom: 0,
        left: 0,
      }}
    >
      {content}
    </Stack>
  );
}
