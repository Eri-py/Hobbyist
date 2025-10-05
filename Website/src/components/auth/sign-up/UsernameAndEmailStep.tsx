import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { OAuthButtonGroup } from "../OAuthButtonGroup";
import { CustomFormHeader, CustomTextField } from "../CustomInputs";
import { AuthFooter } from "../AuthFooter";

type UsernameAndEmailStepProps = {
  handleNext: () => void;
  isPending: boolean;
};

export function UsernameAndEmailStep({ handleNext, isPending }: UsernameAndEmailStepProps) {
  return (
    <Stack gap="0.75rem" paddingInline="1rem">
      <CustomFormHeader
        header="Sign up"
        subtext="join thousands of users already on our platform."
        align="flex-start"
      />

      <CustomTextField
        type="text"
        label="Username"
        fieldValue="username"
        startIcon={<AccountCircleOutlinedIcon />}
        autoComplete="off"
        autoFocus
      />

      <CustomTextField
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

      <OAuthButtonGroup />

      <AuthFooter mode="register" />
    </Stack>
  );
}
