import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { PostTile } from "@/components/shared/PostTile";
import { Searchbar } from "@/components/app/Searchbar/Searchbar";
import { useDesktopNavbar } from "@/hooks/app/useDesktopNavbar";
import { LeftButtonGroup } from "@/components/home/LeftButtonGroup";
import { useMobileNavbar } from "@/hooks/app/useMobileNavbar";
import { MobileSearchOverlay } from "@/components/shared/MobileSearchOverlay";
import { MobileNavbar } from "@/components/app/Navbar/MobileNavbar";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const { setSearchbar, setRightButtonGroup } = useDesktopNavbar();
  const { isMobileSearchOverlayOpen } = useMobileNavbar();

  // Set and clear searchbar on homepage mount and unmount
  useEffect(() => {
    setSearchbar(<Searchbar />);
    return () => {
      setSearchbar(<div></div>);
    };
  }, [setSearchbar]);

  useEffect(() => {
    setRightButtonGroup(<LeftButtonGroup />);
    return () => {
      setRightButtonGroup(<div></div>);
    };
  }, [setRightButtonGroup]);

  return (
    <>
      <MobileSearchOverlay isOpen={isMobileSearchOverlayOpen}>
        <MobileNavbar />
      </MobileSearchOverlay>

      <PostTile />
      <PostTile />
      <PostTile />
      <PostTile />
    </>
  );
}
