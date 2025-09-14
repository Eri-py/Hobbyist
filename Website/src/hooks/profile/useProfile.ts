import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../app/useAuth";

export function useProfile() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const navigateToProfile = (targetUsername: string) => {
    navigate({ to: "/profile/$username", params: { username: targetUsername } });
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigateToProfile(user!.username);
    } else {
      navigate({ to: "/profile" });
    }
  };

  return {
    navigateToProfile,
    handleProfileClick,
  };
}
