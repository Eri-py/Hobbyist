import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import ListItemText from "@mui/material/ListItemText";
import { alpha, useTheme } from "@mui/material/styles";

export type CreateTipKey = "details" | "media" | "preview";

const TIP_TEXT: Record<CreateTipKey, string> = {
  details: "Keep title concise and description clear.",
  media: "Upload images and videos from multiple angles.",
  preview: "Preview your post before sharing.",
};

type CreateTipsProps = {
  activeTip?: CreateTipKey;
};

export function CreateTips({ activeTip }: CreateTipsProps) {
  const theme = useTheme();
  if (activeTip) {
    return (
      <Typography variant="body2" color="text.secondary">
        Tip: {TIP_TEXT[activeTip]}
      </Typography>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{ paddingY: 1, boxShadow: `1px 1px .5px ${alpha(theme.palette.primary.main, 0.25)};` }}
    >
      <Typography variant="body2" fontWeight="bold" sx={{ paddingX: 2 }}>
        Tips:
      </Typography>
      <List dense sx={{ py: 0.5 }}>
        {Object.entries(TIP_TEXT).map((entry) => (
          <ListItem key={entry[0]} sx={{ color: "text.secondary", py: 0.25 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <TipsAndUpdatesIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </ListItemIcon>
            <ListItemText primary={entry[1]} sx={{ my: 0 }} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
