import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { Searchbar } from "@/components/app/Searchbar/Searchbar";
import { useDesktopNavbar } from "@/hooks/app/useDesktopNavbar";

export const Route = createFileRoute("/_app/trade")({
  component: TradePage,
});

function TradePage() {
  const { setSearchbar } = useDesktopNavbar();

  // Set and clear searchbar on homepage mount and unmount
  useEffect(() => {
    setSearchbar(<Searchbar />);
    return () => {
      setSearchbar(<div></div>);
    };
  }, [setSearchbar]);
  return <div>User is trying to trade</div>;
}
