import { useCallback } from "react";

import { useNavigate } from "@tanstack/react-router";

export function useNavigationButtons() {
  const navigate = useNavigate();

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

  const handleSettingsClick = useCallback(() => {
    navigate({ to: "/settings" });
  }, [navigate]);

  return {
    handleMessagesClick,
    handleHomeClick,
    handleTradeClick,
    handleEventsClick,
    handleSettingsClick,
  };
}
