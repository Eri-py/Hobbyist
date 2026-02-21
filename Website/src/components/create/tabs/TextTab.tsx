import { useFormContext, get } from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export function TextTab() {
  const theme = useTheme();
  const isDesktopView = useMediaQuery(theme.breakpoints.up("md"));

  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  const titleValue = watch("title") || "";

  return (
    <Stack gap={2}>
      <Box sx={{ position: "relative" }}>
        <TextField
          {...register("title")}
          variant="outlined"
          placeholder="Title"
          fullWidth
          error={!!get(errors, "title")}
          helperText={get(errors, "title")?.message}
        />
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            right: 12,
            bottom: errors.title ? 24 : 8,
            color: "text.secondary",
            fontSize: "0.75rem",
          }}
        >
          {titleValue.length}/300
        </Typography>
      </Box>

      <TextField
        {...register("description")}
        placeholder="Description"
        multiline
        rows={isDesktopView ? 8 : 6}
        fullWidth
        variant="outlined"
        error={!!errors.description}
        helperText={get(errors, "title")?.message}
        slotProps={{
          htmlInput: {
            sx: {
              resize: "vertical",
              overflow: "auto",
              maxHeight: 500,
            },
          },
        }}
      />
    </Stack>
  );
}
