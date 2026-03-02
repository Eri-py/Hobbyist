import { useFormContext, get } from "react-hook-form";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export function DescriptionTab() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();
  const titleValue = watch("title") || "";

  return (
    <Stack gap={3}>
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
          }}
        >
          {titleValue.length}/300
        </Typography>
      </Box>

      <TextField
        {...register("description")}
        placeholder="Description"
        multiline
        rows={7}
        fullWidth
        variant="outlined"
        error={!!get(errors, "description")}
        helperText={get(errors, "description")?.message}
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
