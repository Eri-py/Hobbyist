import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LockIcon from "@mui/icons-material/Lock";

import { CustomFormHeader, CustomTextField } from "../CustomInputs";
import { AuthFooter } from "../AuthFooter";
import { OAuthButtonGroup } from "../OAuthButtonGroup";

type UsernameAndPasswordProps = {
  handleNext: () => void;
  isPending: boolean;
  isContinueDisabled: boolean;
};

export function UsernameAndPassword({
  handleNext,
  isPending,
  isContinueDisabled,
}: UsernameAndPasswordProps) {
  return (
    <Stack gap="0.75rem" paddingInline="1rem">
      <CustomFormHeader header="Log in" subtext="Glad to have you back!" align="center" />

      <CustomTextField
        type="text"
        label="Username or Email"
        fieldValue="identifier"
        startIcon={<AccountCircleOutlinedIcon />}
        autoComplete="email"
      />

      <CustomTextField
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
        disabled={isContinueDisabled}
      >
        Continue
      </Button>

      <OAuthButtonGroup />

      <AuthFooter mode="login" />
    </Stack>
  );
}
