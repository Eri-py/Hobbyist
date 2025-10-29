import type { ReactElement } from "react";

import AddIcon from "@mui/icons-material/Add";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeIcon from "@mui/icons-material/Home";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import ChatIcon from "@mui/icons-material/Chat";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import EventIcon from "@mui/icons-material/Event";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PersonIcon from "@mui/icons-material/Person";
import { styled } from "@mui/material/styles";
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
  icon: ReactElement;
  activeIcon: ReactElement;
  notifications?: number;
  handleClick: () => void;
};

export function NavigationButtons() {
  const { handleHomeClick, handleMessagesClick, handleCreateClick, handleEventsClick } =
    useNavigationButtons();
  const { handleProfileClick } = useProfile();
  const { getActiveTab } = useNavigation();
  const { user } = useAuth();

  const navigationItems: NavigationItem[] = [
    {
      label: "Home",
      icon: <HomeOutlinedIcon style={{ fontSize: 28 }} />,
      activeIcon: <HomeIcon style={{ fontSize: 28 }} />,
      handleClick: handleHomeClick,
    },
    {
      label: "Events",
      icon: <EventOutlinedIcon style={{ fontSize: 28 }} />,
      activeIcon: <EventIcon style={{ fontSize: 28 }} />,
      handleClick: handleEventsClick,
    },
    {
      label: "Create",
      icon: <AddIcon style={{ fontSize: 28 }} />,
      activeIcon: <AddIcon style={{ fontSize: 28 }} />,
      handleClick: handleCreateClick,
    },
    {
      label: "Messages",
      icon: <ChatOutlinedIcon style={{ fontSize: 28 }} />,
      activeIcon: <ChatIcon style={{ fontSize: 28 }} />,
      notifications: 2,
      handleClick: handleMessagesClick,
    },
    {
      label: `Profile/${user?.username}`,
      icon: <PersonOutlineOutlinedIcon style={{ fontSize: 28 }} />,
      activeIcon: <PersonIcon style={{ fontSize: 28 }} />,
      handleClick: handleProfileClick,
    },
  ];

  const navigationButtons = navigationItems.map((item) => {
    const isActive = getActiveTab(item.label);

    return (
      <IconButton size="large" onClick={item.handleClick} key={item.label}>
        {isActive ? item.activeIcon : item.icon}
        {item.notifications && (
          <NotificationBadge badgeContent={item.notifications} color="primary" overlap="circular" />
        )}
      </IconButton>
    );
  });

  return navigationButtons;
}
