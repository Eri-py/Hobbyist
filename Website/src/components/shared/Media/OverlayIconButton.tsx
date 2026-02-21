import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";

export const OverlayIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  color: "white",
  padding: theme.spacing(0.5),
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
}));
