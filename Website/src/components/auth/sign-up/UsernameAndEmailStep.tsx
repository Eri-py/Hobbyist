import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { OAuthButtons } from "../OAuthButtons";
import { FormTextField } from "../FormTextField";
import { AuthFooter } from "../AuthFooter";

type UsernameAndEmailStepProps = {
  handleNext: () => void;
  isPending: boolean;
};

export function UsernameAndEmailStep({ handleNext, isPending }: UsernameAndEmailStepProps) {
  return (
    <Stack sx={{
      gap: 2
    }}>
      <FormTextField
        type="text"
        label="Username"
        fieldValue="username"
        startIcon={<AccountCircleOutlinedIcon />}
        autoComplete="off"
        autoFocus
      />
      <FormTextField
        type="email"
        label="Email"
        fieldValue="email"
        startIcon={<EmailOutlinedIcon />}
        autoComplete="email"
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
      <OAuthButtons mode="sign-up" />
      <AuthFooter mode="sign-up" />
    </Stack>
  );
}
