import Avatar from "@mui/material/Avatar";
import ListItemButton from "@mui/material/ListItemButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useAuth } from "@hobbyist/hooks";

type IdentityCardProps = {
  onClick: () => void;
};

export function IdentityCard({ onClick }: IdentityCardProps) {
  const { user } = useAuth();
  const firstname = user?.firstname;
  const lastname = user?.lastname;
  const username = user?.username;

  const fullName = [firstname, lastname].filter(Boolean).join(" ").trim();
  const initials = [firstname?.[0], lastname?.[0]]
    .filter((char): char is string => Boolean(char))
    .map((char) => char.toUpperCase())
    .join(" ");

  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        borderRadius: 3,
        padding: 2,
        gap: 2,
        border: "1px solid",
        borderColor: "divider",
        maxHeight: 120,
      }}
    >
      <Avatar
        sx={{
          width: 56,
          height: 56,
        }}
      >
        {initials}
      </Avatar>

      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {fullName}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
          @{username}
        </Typography>
      </Stack>
      <ChevronRightRoundedIcon sx={{ color: "text.secondary" }} />
    </ListItemButton>
  );
}
