import { get, useFormContext } from "react-hook-form";

import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import type { TextFieldProps } from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";

import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";

type TradeOptionsFormInputProps = {
  heading?: string;
  toggleLabel?: string;
  fieldLabel?: string;
};

type CreateFieldName = Extract<keyof CreateFormSchemaTypes, string>;

type FormInputProps = {
  field: CreateFieldName;
  label?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  size?: TextFieldProps["size"];
  multiline?: boolean;
  rows?: number;
  focused?: boolean;
  sx?: SxProps<Theme>;
  slotProps?: TextFieldProps["slotProps"];
};

const baseInputSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "primary.main",
  },
};

export function FormInput({
  field,
  label,
  placeholder,
  helperText,
  disabled,
  size = "small",
  multiline,
  rows,
  focused,
  sx,
  slotProps,
}: FormInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();

  const fieldError = get(errors, field);
  const resolvedHelperText = (fieldError?.message as string | undefined) ?? helperText;
  const resolvedSx: SxProps<Theme> = Array.isArray(sx)
    ? [baseInputSx, ...sx]
    : sx
      ? [baseInputSx, sx]
      : baseInputSx;

  return (
    <Stack sx={{
      gap: 1
    }}>
      {label && <Typography variant="subtitle2">{label}</Typography>}
      <TextField
        {...register(field)}
        variant="outlined"
        size={size}
        placeholder={placeholder}
        autoComplete="off"
        fullWidth
        disabled={disabled}
        multiline={multiline}
        rows={rows}
        focused={focused}
        sx={resolvedSx}
        error={!!fieldError}
        helperText={resolvedHelperText}
        slotProps={slotProps}
      />
    </Stack>
  );
}

export function TradeOptionsFormInput({
  heading = "Trade preferences",
  toggleLabel = "Available for trade",
  fieldLabel = "What are you looking for?",
}: TradeOptionsFormInputProps) {
  const { setValue, watch } = useFormContext<CreateFormSchemaTypes>();

  const isTradable = watch("availableForTrade") ?? false;

  return (
    <Stack sx={{
      gap: 1
    }}>
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
      <FormInput
        field="lookingFor"
        placeholder={fieldLabel}
        size="small"
        focused={isTradable}
        disabled={!isTradable}
      />
    </Stack>
  );
}
