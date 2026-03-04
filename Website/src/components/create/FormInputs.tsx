import { get, useFormContext } from "react-hook-form";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";

type TitleFormInputProps = {
  label?: string;
  placeholder?: string;
};

type DescriptionFormInputProps = {
  label?: string;
  placeholder?: string;
  rows?: number;
};

type TradeOptionsFormInputProps = {
  heading?: string;
  toggleLabel?: string;
  fieldLabel?: string;
};

export function TitleFormInput({
  label = "Title",
  placeholder = "e.g. Mint Charizard holo, PSA 9",
}: TitleFormInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();

  const titleError = get(errors, "title");

  return (
    <Stack gap={1}>
      <Typography variant="subtitle2">{label}</Typography>
      <TextField
        {...register("title")}
        variant="outlined"
        placeholder={placeholder}
        autoComplete="off"
        fullWidth
        sx={{
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.main",
          },
        }}
        error={!!titleError}
        helperText={titleError?.message as string | undefined}
      />
    </Stack>
  );
}

export function DescriptionFormInput({
  label = "Description",
  placeholder = "Describe condition, notable details, and what makes this collectible special",
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
        autoComplete="off"
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
              if (!event.target.checked) {
                setValue("lookingFor", "", { shouldDirty: true });
              }
            }}
          />
        }
        label={toggleLabel}
      />

      <Stack gap={1}>
        <TextField
          {...register("lookingFor")}
          placeholder={fieldLabel}
          autoComplete="off"
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
    </Stack>
  );
}
