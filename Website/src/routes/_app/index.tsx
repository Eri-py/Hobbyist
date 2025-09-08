import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { PostTile } from "@/shared/components/PostTile";
import { useDesktopNavbar } from "../../hooks/app/useDesktopNavbar";
import { LeftButtonGroup } from "../../components/home/LeftButtonGroup";
import { Searchbar } from "@/components/app/Searchbar/Searchbar";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const { setSearchbar, setLeftButtonGroup } = useDesktopNavbar();

  // Set and clear searchbar on homepage mount and unmount
  useEffect(() => {
    setSearchbar(<Searchbar />);
    return () => {
      setSearchbar(<div></div>);
    };
  }, [setSearchbar]);

  useEffect(() => {
    setLeftButtonGroup(<LeftButtonGroup />);
    return () => {
      setLeftButtonGroup(<div></div>);
    };
  }, [setLeftButtonGroup]);

  return (
    <>
      <PostTile />
      <PostTile />
      <PostTile />
      <PostTile />
    </>
  );
}
