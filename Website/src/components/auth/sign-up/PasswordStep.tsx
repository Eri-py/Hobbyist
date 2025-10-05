import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import LockIcon from "@mui/icons-material/Lock";

import { CustomFormHeader, CustomTextField } from "../CustomInputs";

type PasswordProps = {
  handleNext: () => void;
};

export function PasswordStep({ handleNext }: PasswordProps) {
  return (
    <Stack gap="0.75rem" paddingInline="1rem">
      <CustomFormHeader
        header="Create a strong password"
        subtext="We will never ask you for your password."
        align="flex-start"
      />

      <CustomTextField
        type="password"
        label="Password"
        fieldValue="password"
        startIcon={<LockIcon />}
        autoComplete="new-password"
      />

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
