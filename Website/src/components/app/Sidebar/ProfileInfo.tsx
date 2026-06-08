import Avatar from "@mui/material/Avatar";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useProfile } from "@/hooks/profile/useProfile";
import IconButton from "@mui/material/IconButton";

type ProfileInfoProps = {
  username: string | null;
};

export function ProfileInfo({ username }: ProfileInfoProps) {
  const { handleProfileClick } = useProfile();
  return (
    <IconButton onClick={handleProfileClick} aria-label={username ?? "profile"}>
      <Avatar sx={{ width: 65, height: 65 }}>
        <AccountCircleIcon fontSize="large" />
      </Avatar>
    </IconButton>
  );
}
