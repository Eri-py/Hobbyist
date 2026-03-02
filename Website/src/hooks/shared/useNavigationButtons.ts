import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@hobbyist/hooks";

export function useNavigationButtons() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleSettingsClick = () => {
    if (user?.username) {
      navigate({ to: `/profile/${user.username}/settings` });
      return;
    }

    navigate({ to: "/profile" });
  };

  return {
    handleCreateClick,
    handleMessagesClick,
    handleHomeClick,
    handleTradeClick,
    handleEventsClick,
    handleSettingsClick,
  };
}
