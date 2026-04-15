import { type ReactElement } from "react";

import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import ChatIconOulined from "@mui/icons-material/ChatOutlined";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import { styled } from "@mui/material/styles";
import Badge, { badgeClasses } from "@mui/material/Badge";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";

import { useNavigation, type MobileNavbarItem } from "@/hooks/app/useNavigation";

const NotificationBadge = styled(Badge)`
  & .${badgeClasses.badge} {
    top: 0.25rem;
    right: 0rem;
  }
`;

type NavigationItem = {
  label: string;
  icon: ReactElement;
  handleClick: () => void;
  notifications?: number;
};

export function NavigationButtons() {
  const { mobileItems, activeTab } = useNavigation();

  const getMobileIcon = (item: MobileNavbarItem): ReactElement => {
    switch (item.key) {
      case "home":
        return <HomeIcon style={{ fontSize: 28 }} />;
      case "events":
        return <EventIcon style={{ fontSize: 28 }} />;
      case "create":
        return <AddIcon style={{ fontSize: 28 }} />;
      case "messages":
        return <ChatIconOulined style={{ fontSize: 28 }} />;
      case "profile":
        return <PersonIcon style={{ fontSize: 28 }} />;
    }
  };

  const navigationItems: NavigationItem[] = mobileItems.map((item) => ({
    label: item.label,
    icon: getMobileIcon(item),
    handleClick: item.handleClick,
    notifications: item.notifications,
  }));

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
