import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactElement, type SyntheticEvent } from "react";

import Stack from "@mui/material/Stack";
import SettingsIcon from "@mui/icons-material/Settings";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Rating from "@mui/material/Rating";

import { useAuth } from "@/hooks/app/useAuth";

type NavigationItem = {
  label: string;
  icon: ReactElement;
  handleClick: () => void;
};

export const Route = createFileRoute("/_app/profile/$username/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const isOwnProfile = user?.username == username;
  const navigate = useNavigate();

  // Tab navigation handlers
  const handlePostsClick = () => {};

  const handleBookmarksClick = () => {};

  const handleFavoritesClick = () => {};

  const handleSettingsClick = () => {
    navigate({ to: `/profile/${username}/settings` });
  };

  const navigationItems: NavigationItem[] = [
    {
      label: "Posts",
      icon: <CameraAltOutlinedIcon />,
      handleClick: handlePostsClick,
    },
    {
      label: "Bookmarks",
      icon: <BookmarkBorderIcon />,
      handleClick: handleBookmarksClick,
    },
    {
      label: "Favorites",
      icon: <FavoriteBorderIcon />,
      handleClick: handleFavoritesClick,
    },
  ];

  const handleTabChange = (_: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    navigationItems[newValue].handleClick();
  };

  return (
    <Stack
      padding={2}
      gap={3}
      flex={1}
      maxWidth={1000}
      sx={{ marginX: { xs: "undefined", md: "auto" } }}
    >
      {/* This is the profile picture and profile info */}
      <Stack direction="row" gap={3} alignSelf="flex-start">
        <Avatar sx={{ width: 75, height: 75 }} />
        <Stack>
          <Typography fontWeight={500} fontSize={18}>
            {username}
          </Typography>
          <Stack direction="row" gap={3}>
            <Stack>
              <Typography>0</Typography>
              <Typography color="text.secondary" fontWeight={200}>
                posts
              </Typography>
            </Stack>
            <Stack>
              <Rating name="read-only" value={2} readOnly />
              <Typography color="text.secondary" fontWeight={200}>
                rating
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      {/* This is the button group below */}
      <Stack direction="row" alignSelf="center" width="100%" maxWidth={800}>
        <Stack direction="row" width="100%" gap={1}>
          <Button variant="contained" sx={{ flex: 1 }}>
            Edit Profile
          </Button>
          <Button variant="contained" sx={{ flex: 1 }}>
            Share Profile
          </Button>
        </Stack>
        {isOwnProfile && (
          <IconButton onClick={handleSettingsClick}>
            <SettingsIcon />
          </IconButton>
        )}
      </Stack>
      {/* This is the tab group */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {navigationItems.map((item) => (
          <Tab key={item.label} icon={item.icon} />
        ))}
      </Tabs>
      {/* This renders the users posts and what not */}
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Stack alignItems="center">
          <CameraAltOutlinedIcon sx={{ fontSize: { xs: 78, md: 128 } }} />
          <Typography fontWeight={600} fontSize={30}>
            {navigationItems[activeTab].label}
          </Typography>
          <Typography fontSize={{ xs: 15, md: 18 }}>
            {activeTab === 0 && "When you post, they will appear on your profile."}
            {activeTab === 1 && "Your bookmarked content will appear here."}
            {activeTab === 2 && "Your favorite content will appear here."}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
