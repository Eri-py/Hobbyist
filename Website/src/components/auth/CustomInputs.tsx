import { useFormContext, get } from "react-hook-form";
import { useState, type ReactNode } from "react";

import { useTheme } from "@mui/material/styles";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Button from "@mui/material/Button";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Stack from "@mui/material/Stack";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";

import { Selector } from "@/shared/components/Selector";

type CustomTextFieldProps = TextFieldProps & {
  type: string;
  label: string;
  fieldValue: string;
  startIcon?: ReactNode;
  flex?: number;
  autoComplete?: string;
};

export function CustomTextField({
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
          padding: "0rem",
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
      variant="outlined"
      type={isPasswordField ? (isPasswordVisible ? "text" : "password") : type}
      label={label}
      error={!!get(errors, fieldValue)}
      helperText={get(errors, fieldValue)?.message}
      autoComplete={autoComplete}
      slotProps={{
        input: {
          startAdornment: startIcon ?? "",
          endAdornment: isPasswordField && passwordEndAdornment(),
          sx: {
            gap: "0.5rem",
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

type SegmentedDatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
};

export function SegmentedDatePicker({ value, onChange, error }: SegmentedDatePickerProps) {
  const months = [
    { id: "01", label: "January" },
    { id: "02", label: "February" },
    { id: "03", label: "March" },
    { id: "04", label: "April" },
    { id: "05", label: "May" },
    { id: "06", label: "June" },
    { id: "07", label: "July" },
    { id: "08", label: "August" },
    { id: "09", label: "September" },
    { id: "10", label: "October" },
    { id: "11", label: "November" },
    { id: "12", label: "December" },
  ];

  let [year, month, day] = value ? value.split("-") : "".split("-");
  if (!day) day = "";
  if (!month) month = "";
  if (!year) year = "";

  const theme = useTheme();

  const handleDayChange = (newDay: string) => {
    if (newDay === "") onChange(`${year}-${month}-${""}`);
    else if (newDay.match("^[0-9]+$")) onChange(`${year}-${month}-${newDay}`);
  };

  const handleMonthChange = (newMonth: string) => {
    onChange(`${year}-${newMonth}-${day}`);
  };

  const handleYearChange = (newYear: string) => {
    if (newYear === "") onChange(`${""}-${month}-${day}`);
    else if (newYear.match("^[0-9]+$")) onChange(`${newYear}-${month}-${day}`);
  };

  return (
    <Stack>
      <Stack direction="row" gap="0.75rem">
        <TextField
          type="text"
          variant="outlined"
          label="Day"
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          autoComplete="off"
          sx={{ flex: 1.5 }}
          slotProps={{
            input: {
              sx: {
                gap: "0.5rem",
                backgroundColor: theme.palette.background.paper,
              },
            },
            htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
          }}
        />

        <Selector
          label="Month"
          value={month}
          onChange={handleMonthChange}
          menuItems={months}
          flex={2}
        />

        <TextField
          type="text"
          variant="outlined"
          label="Year"
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          sx={{ flex: 1.5 }}
          autoComplete="off"
          slotProps={{
            input: {
              sx: {
                gap: "0.5rem",
                backgroundColor: theme.palette.background.paper,
              },
            },
            htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
          }}
        />
      </Stack>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Stack>
  );
}

type CustomFormHeaderProps = {
  header: string;
  subtext: string | ReactNode;
  align: string;
};

export function CustomFormHeader({ header, subtext, align }: CustomFormHeaderProps) {
  return (
    <Stack alignItems={align}>
      <Typography fontWeight={500} fontSize="1.5rem" color="textPrimary">
        {header}
      </Typography>
      <Typography
        fontWeight={200}
        fontSize="0.95rem"
        color="textSecondary"
        sx={{ textWrap: "nowrap" }}
      >
        {subtext}
      </Typography>
    </Stack>
  );
}
