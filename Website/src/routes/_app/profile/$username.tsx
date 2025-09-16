import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { Searchbar } from "@/components/app/Searchbar/Searchbar";
import { MobileSearchOverlayContent } from "@/components/home/MobileSearchOverlayContent";
import { RightButtonGroup } from "@/components/home/RightButtonGroup";
import { useAuth } from "@/hooks/app/useAuth";
import { useDesktopNavbar } from "@/hooks/app/useDesktopNavbar";
import { useMobileSearchOverlay } from "@/hooks/app/useMobileSearchOverlay";
import { useNavigation } from "@/hooks/app/useNavigation";

export const Route = createFileRoute("/_app/profile/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { setSearchbar, setRightButtonGroup } = useDesktopNavbar();
  const { setSearchOverlay } = useMobileSearchOverlay();
  const { setActiveTab } = useNavigation();
  const { username } = Route.useParams();
  const { user } = useAuth();
  const isUserProfile = user!.username == username;

  // Set active navigation tab
  useEffect(() => {
    setActiveTab("Profile");
  }, [setActiveTab]);

  // Set and clear desktop searchbar
  useEffect(() => {
    setSearchbar(<Searchbar />);
    return () => {
      setSearchbar(<div></div>);
    };
  }, [setSearchbar]);

  // Set and clear desktop right button group
  useEffect(() => {
    setRightButtonGroup(<RightButtonGroup />);
    return () => {
      setRightButtonGroup(<div></div>);
    };
  }, [setRightButtonGroup]);

  // Set and clear mobile search overlay
  useEffect(() => {
    setSearchOverlay(<MobileSearchOverlayContent />);
    return () => {
      setSearchOverlay(<div></div>);
    };
  }, [setSearchOverlay]);

  return (
    <div>
      {isUserProfile
        ? `${username} is viewing their own profile`
        : `${username}'s profile is being looked at`}
    </div>
  );
}
