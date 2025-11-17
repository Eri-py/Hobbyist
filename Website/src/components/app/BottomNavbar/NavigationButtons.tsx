import type { ReactElement } from "react";
import React from "react";

import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import ChatIconOulined from "@mui/icons-material/ChatOutlined";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import { styled, useTheme } from "@mui/material/styles";
import Badge, { badgeClasses } from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";
import { useProfile } from "@/hooks/profile/useProfile";
import { useNavigation } from "@/hooks/app/useNavigation";

const NotificationBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -1.5rem;
    right: -0.75rem;
  }
`;

const NavButton = styled(IconButton)({
  display: "flex",
  flexDirection: "column",
  padding: "4px 8px",
  borderRadius: 8,
});

const LabelText = styled(Typography)(() => ({
  fontSize: 10,
  lineHeight: 1.2,
  marginTop: -4,
}));

type NavigationItem = {
  label: string;
  icon: ReactElement<{ style?: React.CSSProperties }>;
  handleClick: () => void;
  notifications?: number;
};

export function NavigationButtons() {
  const theme = useTheme();
  const { handleHomeClick, handleMessagesClick, handleCreateClick, handleEventsClick } =
    useNavigationButtons();
  const { handleProfileClick } = useProfile();
  const { getActiveTab } = useNavigation();

  const navigationItems: NavigationItem[] = [
    {
      label: "Home",
      icon: <HomeIcon style={{ fontSize: 28 }} />,
      handleClick: handleHomeClick,
    },
    {
      label: "Events",
      icon: <EventIcon style={{ fontSize: 28 }} />,
      handleClick: handleEventsClick,
    },
    {
      label: "Create",
      icon: <AddIcon style={{ fontSize: 28 }} />,
      handleClick: handleCreateClick,
    },
    {
      label: "Messages",
      icon: <ChatIconOulined style={{ fontSize: 28 }} />,
      notifications: 2,
      handleClick: handleMessagesClick,
    },
    {
      label: "Profile",
      icon: <PersonIcon style={{ fontSize: 28 }} />,
      handleClick: handleProfileClick,
    },
  ];

  const navigationButtons = navigationItems.map((item) => {
    const isActive = getActiveTab(item.label);
    const iconColor = isActive ? theme.palette.primary.light : undefined;
    const textColor = isActive ? theme.palette.primary.light : theme.palette.text.secondary;

    const coloredIcon = React.cloneElement(item.icon, {
      style: { ...item.icon.props.style, color: iconColor, width: 28 },
    });

    return (
      <Stack key={item.label} alignItems="center">
        <NavButton size="small" onClick={item.handleClick}>
          {coloredIcon}
          {item.notifications && (
            <NotificationBadge
              badgeContent={item.notifications}
              color="secondary"
              overlap="circular"
            />
          )}
        </NavButton>
        <LabelText sx={{ color: textColor }}>{item.label}</LabelText>
      </Stack>
    );
  });

  return <>{navigationButtons}</>;
}
