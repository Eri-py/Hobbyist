import { useFormContext } from "react-hook-form";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import LockIcon from "@mui/icons-material/Lock";

import { FormTextField } from "../FormTextField";
import { PasswordRequirements } from "./PasswordRequirements";
import { useDebounce } from "@/hooks/shared/useDebounce";

type PasswordProps = {
  handleNext: () => void;
};

export function PasswordStep({ handleNext }: PasswordProps) {
  const { watch } = useFormContext();
  const password: string = useDebounce(watch("password") || "");

  return (
    <Stack
      sx={{
        flex: 1,
        gap: 1.5
      }}>
      <FormTextField
        type="password"
        label="Password"
        fieldValue="password"
        startIcon={<LockIcon />}
        autoComplete="new-password"
        autoFocus
      />
      <PasswordRequirements password={password} />
      <FormTextField
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
