import { get, useFormContext } from "react-hook-form";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";

type TitleFormInputProps = {
  label?: string;
  placeholder: string;
};

type DescriptionFormInputProps = {
  label?: string;
  placeholder: string;
  rows?: number;
};

type TradeOptionsFormInputProps = {
  heading?: string;
  toggleLabel?: string;
  fieldLabel?: string;
  placeholder?: string;
};

export function TitleFormInput({ label = "Title", placeholder }: TitleFormInputProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<CreateFormSchemaTypes>();

  const titleValue = watch("title") || "";
  const titleError = get(errors, "title");

  return (
    <Stack gap={1}>
      <Typography variant="subtitle2">{label}</Typography>
      <Box sx={{ position: "relative" }}>
        <TextField
          {...register("title")}
          variant="outlined"
          placeholder={placeholder}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          }}
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
    </Stack>
  );
}

export function DescriptionFormInput({
  label = "Description",
  placeholder,
  rows = 5,
}: DescriptionFormInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();

  const descriptionError = get(errors, "description");

  return (
    <Stack gap={1}>
      <Typography variant="subtitle2">{label}</Typography>
      <TextField
        {...register("description")}
        placeholder={placeholder}
        multiline
        rows={rows}
        fullWidth
        variant="outlined"
        sx={{
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.main",
          },
        }}
        error={!!descriptionError}
        helperText={descriptionError?.message as string | undefined}
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

export function TradeOptionsFormInput({
  heading = "Trade preferences",
  toggleLabel = "Available for trade",
  fieldLabel = "What are you looking for?",
  placeholder = "e.g. Blastoise cards, sealed booster packs, vintage items",
}: TradeOptionsFormInputProps) {
  const {
    register,
    setValue,
    formState: { errors },
    watch,
  } = useFormContext<CreateFormSchemaTypes>();

  const isTradable = watch("availableForTrade") ?? false;
  const lookingForError = get(errors, "lookingFor");

  return (
    <Stack gap={1}>
      <Typography variant="subtitle2">{heading}</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={isTradable}
            onChange={(event) => {
              setValue("availableForTrade", event.target.checked, {
                shouldDirty: true,
                shouldTouch: true,
              });
            }}
          />
        }
        label={toggleLabel}
      />

      <TextField
        {...register("lookingFor")}
        label={fieldLabel}
        placeholder={placeholder}
        fullWidth
        size="small"
        sx={{
          ...(isTradable && {
            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          }),
        }}
        disabled={!isTradable}
        error={!!lookingForError}
        helperText={lookingForError?.message as string | undefined}
      />
    </Stack>
  );
}
