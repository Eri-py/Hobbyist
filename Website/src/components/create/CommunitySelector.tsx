import { useTheme } from "@mui/material/styles";

import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

type CommunitySelectorProps = {
  selectedCommunity: string;
  onCommunityChange: (community: string) => void;
};

export function CommunitySelector({
  selectedCommunity,
  onCommunityChange,
}: CommunitySelectorProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.5,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "20px",
        backgroundColor: theme.palette.background.default,
        flex: 1,
      }}
    >
      <Select
        value={selectedCommunity}
        onChange={(e) => onCommunityChange(e.target.value)}
        variant="standard"
        disableUnderline
        sx={{
          flex: 1,
          "& .MuiSelect-select": {
            padding: 0,
            fontSize: "0.875rem",
          },
        }}
      >
        <MenuItem value="Select a community">Select a community</MenuItem>
        <MenuItem value="Community 1">Community 1</MenuItem>
        <MenuItem value="Community 2">Community 2</MenuItem>
      </Select>
    </Paper>
  );
}
