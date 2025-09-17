import { useNavigate } from "@tanstack/react-router";

export function useNavigationButtons() {
  const navigate = useNavigate();

  // Create button.
  const handleCreateClick = () => {
    navigate({ to: "/create" });
  };

  //messages button. Would probably move to its own separate hook to handle notifications.
  const handleMessagesClick = () => {
    navigate({ to: "/messages" });
  };

  const handleHomeClick = () => {
    navigate({ to: "/" });
  };

  const handleTradeClick = () => {
    navigate({ to: "/trade" });
  };

  const handleEventsClick = () => {
    navigate({ to: "/events" });
  };

  const handleExploreClick = () => {
    navigate({ to: "/explore/hobbies" });
  };

  return {
    handleCreateClick,
    handleMessagesClick,
    handleHomeClick,
    handleTradeClick,
    handleEventsClick,
    handleExploreClick,
  };
}
