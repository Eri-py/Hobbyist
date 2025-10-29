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
};

export function UsernameAndPassword({ handleNext, isPending }: UsernameAndPasswordProps) {
  return (
    <Stack gap={2} paddingInline={2}>
      <CustomFormHeader header="Log in" subtext="Glad to have you back!" align="flex-start" />

      <CustomTextField
        type="text"
        label="Username or Email"
        fieldValue="identifier"
        startIcon={<AccountCircleOutlinedIcon />}
        autoComplete="email"
        autoFocus
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
      >
        Continue
      </Button>

      <OAuthButtonGroup mode="login" />

      <AuthFooter mode="login" />
    </Stack>
  );
}
