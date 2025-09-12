import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { PostTile } from "@/components/shared/PostTile";
import { Searchbar } from "@/components/app/Searchbar/Searchbar";
import { useDesktopNavbar } from "@/hooks/app/useDesktopNavbar";
import { RightButtonGroup } from "@/components/home/RightButtonGroup";
import { useMobileSearchOverlay } from "@/hooks/app/useMobileSearchOverlay";
import { MobileSearchOverlayContent } from "@/components/home/MobileSearchOverlayContent";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const { setSearchbar, setRightButtonGroup } = useDesktopNavbar();
  const { setSearchOverlay } = useMobileSearchOverlay();

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
    <>
      <PostTile />
      <PostTile />
      <PostTile />
      <PostTile />
    </>
  );
}
