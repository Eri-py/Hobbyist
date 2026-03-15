import { type ReactElement } from "react";
import { useNavigate } from "@tanstack/react-router";

import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import ChatIconOulined from "@mui/icons-material/ChatOutlined";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import { styled } from "@mui/material/styles";
import Badge, { badgeClasses } from "@mui/material/Badge";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";

import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";
import { useProfile } from "@/hooks/profile/useProfile";
import { useNavigation } from "@/hooks/app/useNavigation";
import { useFeatureFlags } from "@hobbyist/hooks";
import { FeatureFlags } from "@hobbyist/types";

const NotificationBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: -1.5rem;
    right: -0.75rem;
  }
`;

type NavigationItem = {
  label: string;
  icon: ReactElement;
  handleClick: () => void;
  notifications?: number;
};

export function NavigationButtons() {
  const { handleHomeClick, handleMessagesClick, handleEventsClick } = useNavigationButtons();
  const navigate = useNavigate();
  const { handleProfileClick } = useProfile();
  const { activeTab } = useNavigation();
  const flags = useFeatureFlags();

  const navigationItems: NavigationItem[] = [
    {
      label: "Home",
      icon: <HomeIcon style={{ fontSize: 28 }} />,
      handleClick: handleHomeClick,
    },
    ...(flags[FeatureFlags.Events]
      ? [
          {
            label: "Events",
            icon: <EventIcon style={{ fontSize: 28 }} />,
            handleClick: handleEventsClick,
          },
        ]
      : []),
    {
      label: "Create",
      icon: <AddIcon style={{ fontSize: 28 }} />,
      handleClick: () => navigate({ to: "/create" }),
    },
    ...(flags[FeatureFlags.Messages]
      ? [
          {
            label: "Messages",
            icon: <ChatIconOulined style={{ fontSize: 28 }} />,
            notifications: 2,
            handleClick: handleMessagesClick,
          },
        ]
      : []),
    {
      label: "Profile",
      icon: <PersonIcon style={{ fontSize: 28 }} />,
      handleClick: handleProfileClick,
    },
  ];

  return (
    <BottomNavigation value={activeTab} showLabels>
      {navigationItems.map((item) => (
        <BottomNavigationAction
          key={item.label}
          value={item.label}
          label={item.label}
          onClick={item.handleClick}
          icon={
            item.notifications ? (
              <NotificationBadge
                badgeContent={item.notifications}
                color="secondary"
                overlap="circular"
              >
                {item.icon}
              </NotificationBadge>
            ) : (
              item.icon
            )
          }
        />
      ))}
    </BottomNavigation>
  );
}
