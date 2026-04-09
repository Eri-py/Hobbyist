import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LockIcon from "@mui/icons-material/Lock";

import { FormTextField } from "../FormTextField";
import { AuthFooter } from "../AuthFooter";
import { OAuthButtons } from "../OAuthButtons";

type UsernameAndPasswordProps = {
  handleNext: () => void;
  isPending: boolean;
};

export function UsernameAndPassword({ handleNext, isPending }: UsernameAndPasswordProps) {
  return (
    <Stack sx={{
      gap: 2
    }}>
      <FormTextField
        type="text"
        label="Username or Email"
        fieldValue="identifier"
        startIcon={<AccountCircleOutlinedIcon />}
        autoComplete="email"
        autoFocus
      />
      <FormTextField
        type="password"
        label="Password"
        fieldValue="password"
        startIcon={<LockIcon />}
        autoComplete="off"
      />
      <Button
        variant="contained"
        size="large"
        type="button"
        onClick={handleNext}
        loading={isPending}
      >
        Continue
      </Button>
      <OAuthButtons mode="login" />
      <AuthFooter mode="login" />
    </Stack>
  );
}
