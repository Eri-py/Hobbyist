import type { ReactElement } from "react";
import React from "react";

import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import ChatIcon from "@mui/icons-material/Chat";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import { styled, useTheme } from "@mui/material/styles";
import Badge, { badgeClasses } from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";

import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";
import { useProfile } from "@/hooks/profile/useProfile";
import { useNavigation } from "@/hooks/app/useNavigation";
import { useAuth } from "@/hooks/app/useAuth";

const NotificationBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -0.5rem;
    right: 0rem;
  }
`;

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
  const { user } = useAuth();

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
      icon: <ChatIcon style={{ fontSize: 28 }} />,
      notifications: 2,
      handleClick: handleMessagesClick,
    },
    {
      label: `Profile/${user?.username}`,
      icon: <PersonIcon style={{ fontSize: 28 }} />,
      handleClick: handleProfileClick,
    },
  ];

  const navigationButtons = navigationItems.map((item) => {
    const isActive = getActiveTab(item.label);
    const iconColor = isActive ? theme.palette.primary.light : undefined;

    const coloredIcon = React.cloneElement(item.icon, {
      style: { ...item.icon.props.style, color: iconColor },
    });

    return (
      <IconButton size="large" onClick={item.handleClick} key={item.label}>
        {coloredIcon}
        {item.notifications && (
          <NotificationBadge
            badgeContent={item.notifications}
            color="secondary"
            overlap="circular"
          />
        )}
      </IconButton>
    );
  });

  return navigationButtons;
}
