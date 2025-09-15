import type { ReactElement } from "react";

import AddIcon from "@mui/icons-material/Add";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeIcon from "@mui/icons-material/Home";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import ChatIcon from "@mui/icons-material/Chat";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import StoreIcon from "@mui/icons-material/Store";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PersonIcon from "@mui/icons-material/Person";
import { styled } from "@mui/material/styles";
import Badge, { badgeClasses } from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";

import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";
import { useProfile } from "@/hooks/profile/useProfile";
import { useActiveTab } from "@/hooks/shared/useActiveTab";

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
  const { handleHomeClick, handleTradeClick, handleMessagesClick, handleCreateClick } =
    useNavigationButtons();
  const { handleProfileClick } = useProfile();
  const { getActiveTab } = useActiveTab();

  const navigationItems: NavigationItem[] = [
    {
      label: "Home",
      icon: <HomeOutlinedIcon style={{ fontSize: "1.75rem" }} />,
      activeIcon: <HomeIcon style={{ fontSize: "1.75rem" }} />,
      handleClick: handleHomeClick,
    },
    {
      label: "Trade",
      icon: <StoreOutlinedIcon style={{ fontSize: "1.75rem" }} />,
      activeIcon: <StoreIcon style={{ fontSize: "1.75rem" }} />,
      notifications: 10,
      handleClick: handleTradeClick,
    },
    {
      label: "Create",
      icon: <AddIcon style={{ fontSize: "1.75rem" }} />,
      activeIcon: <AddIcon style={{ fontSize: "1.75rem" }} />,
      handleClick: handleCreateClick,
    },
    {
      label: "Messages",
      icon: <ChatOutlinedIcon style={{ fontSize: "1.75rem" }} />,
      activeIcon: <ChatIcon style={{ fontSize: "1.75rem" }} />,
      notifications: 2,
      handleClick: handleMessagesClick,
    },
    {
      label: "Profile",
      icon: <PersonOutlineOutlinedIcon style={{ fontSize: "1.75rem" }} />,
      activeIcon: <PersonIcon style={{ fontSize: "1.75rem" }} />,
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
