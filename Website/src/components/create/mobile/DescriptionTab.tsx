import { useFormContext, get } from "react-hook-form";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { TitleFormInput } from "@/components/create/FormInputs";

export function DescriptionTab() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <Stack gap={3}>
      <TitleFormInput placeholder="Title" />

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
