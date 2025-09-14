import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../app/useAuth";

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

  //profile button. Would probably move to its own separate hook to handle notifications.
  const handleProfileClick = () => {
    if (user) {
      navigate({ to: "/profile/$username", params: { username: user!.username } });
    }
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

  return {
    handleCreateClick,
    handleMessagesClick,
    handleProfileClick,
    handleHomeClick,
    handleTradeClick,
    handleEventsClick,
  };
}
