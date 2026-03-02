import { get, useFormContext } from "react-hook-form";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";

type TitleFormInputProps = {
  label?: string;
  placeholder: string;
};

export function TitleFormInput({ label, placeholder }: TitleFormInputProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<CreateFormSchemaTypes>();

  const titleValue = watch("title") || "";
  const titleError = get(errors, "title");

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        {...register("title")}
        label={label}
        variant="outlined"
        placeholder={placeholder}
        fullWidth
        error={!!titleError}
        helperText={titleError?.message as string | undefined}
      />
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          right: 12,
          bottom: titleError ? 24 : 8,
          color: "text.secondary",
          fontSize: "0.75rem",
        }}
      >
        {titleValue.length}/300
      </Typography>
    </Box>
  );
}
