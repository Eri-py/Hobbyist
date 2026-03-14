import { useFormContext, get } from "react-hook-form";
import { useState, type ReactNode } from "react";

import { useTheme } from "@mui/material/styles";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Button from "@mui/material/Button";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";

type CustomTextFieldProps = TextFieldProps & {
  type: string;
  label: string;
  fieldValue: string;
  startIcon?: ReactNode;
  flex?: number;
  autoComplete?: string;
};

export function FormTextField({
  type,
  label,
  fieldValue,
  startIcon,
  autoComplete,
  ...props
}: CustomTextFieldProps) {
  const theme = useTheme();
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const isPasswordField = type === "password";
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const passwordEndAdornment = () => {
    return (
      <Button
        disableRipple
        type="button"
        variant="text"
        onClick={() => {
          setPasswordVisible(!isPasswordVisible);
        }}
        sx={{
          padding: 0,
          color: theme.palette.text.primary,
          "&:hover": {
            background: "none",
          },
        }}
      >
        {isPasswordVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </Button>
    );
  };

  return (
    <TextField
      {...props}
      fullWidth
      variant="outlined"
      type={isPasswordField ? (isPasswordVisible ? "text" : "password") : type}
      label={label}
      error={!!get(errors, fieldValue)}
      helperText={get(errors, fieldValue)?.message}
      autoComplete={autoComplete}
      sx={{
        ".MuiFormHelperText-root": {
          textWrap: "wrap",
        },
      }}
      slotProps={{
        input: {
          startAdornment: startIcon ?? "",
          endAdornment: isPasswordField && passwordEndAdornment(),
          sx: {
            gap: 1,
            backgroundColor: theme.palette.background.paper,
          },
        },
        htmlInput: {
          ...register(fieldValue),
        },
      }}
    />
  );
}
