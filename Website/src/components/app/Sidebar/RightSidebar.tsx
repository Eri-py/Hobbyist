import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function RightSidebar() {
  return (
    <Stack height="100%" p={2} gap={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          For You
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Personalized insights will appear here once trade and event data is connected.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Upcoming
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.75}>
          No upcoming activity yet.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Quick Actions
        </Typography>
        <Stack direction="row" gap={1} mt={1} flexWrap="wrap">
          <Button size="small" variant="contained">
            Explore Trades
          </Button>
          <Button size="small" variant="outlined">
            Browse Events
          </Button>
        </Stack>
      </Paper>

      <Divider />

      <Typography variant="caption" color="text.secondary">
        Placeholder rail: replace with authenticated user modules when backend endpoints are ready.
      </Typography>
    </Stack>
  );
}
