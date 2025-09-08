import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LockIcon from "@mui/icons-material/Lock";

import { CustomFormHeader, CustomTextField } from "../CustomInputs";

type PasswordProps = {
  handleNext: () => void;
};

export function Password({ handleNext }: PasswordProps) {
  const theme = useTheme();

  return (
    <Stack gap="0.75rem" paddingInline="1rem">
      <CustomFormHeader
        header="Create a strong password"
        subtext="We will never ask you for your password."
        align="flex-start"
      />

      <Stack gap="1rem">
        <CustomTextField
          type="password"
          label="Password"
          fieldValue="password"
          startIcon={<LockIcon />}
          autoComplete="new-password"
        />

        <Stack gap="0.25rem" marginLeft="1rem">
          <Typography fontWeight={200} fontSize="0.8125rem" color={theme.palette.text.secondary}>
            &#149; 8-64 characters
          </Typography>
          <Typography fontWeight={200} fontSize="0.8125rem" color={theme.palette.text.secondary}>
            &#149; One uppercase letter (A-Z)
          </Typography>
          <Typography fontWeight={200} fontSize="0.8125rem" color={theme.palette.text.secondary}>
            &#149; One lowercase letter (a-z)
          </Typography>
          <Typography fontWeight={200} fontSize="0.8125rem" color={theme.palette.text.secondary}>
            &#149; One number (0-9)
          </Typography>
          <Typography fontWeight={200} fontSize="0.8125rem" color={theme.palette.text.secondary}>
            &#149; One special character (# ? ! @ $ % ^ & - .)
          </Typography>
          <Typography fontWeight={200} fontSize="0.8125rem" color={theme.palette.text.secondary}>
            &#149; Only allowed characters above
          </Typography>
        </Stack>
      </Stack>

      <CustomTextField
        type="password"
        label="Confirm Password"
        fieldValue="confirmPassword"
        startIcon={<LockIcon />}
        autoComplete="new-password"
      />

      <Button type="button" variant="contained" size="large" onClick={handleNext}>
        Continue
      </Button>
    </Stack>
  );
}
