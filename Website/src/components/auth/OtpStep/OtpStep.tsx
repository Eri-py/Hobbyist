import { Controller, get, useFormContext } from "react-hook-form";

import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import { useOtp } from "@hobbyist/hooks";
import { useNotifications } from "@/hooks/app/useNotifications";
import { axiosInstance } from "@/api/axiosInstance";
import { OtpInput } from "./OtpInput";
import { OtpCountdown } from "./OtpCountdown";

type OtpStepProps = {
  mode: "login" | "signup";
  email: string;
  intitialOtpExpiresAt: Date;
  handleNext?: () => void;
  isPending: boolean;
};

export function OtpStep({
  mode,
  email,
  intitialOtpExpiresAt,
  handleNext,
  isPending,
}: OtpStepProps) {
  const theme = useTheme();
  const { control } = useFormContext();
  const { notify } = useNotifications();
  const { endTime, isResendDisabled, handleResend, isResending } = useOtp(
    intitialOtpExpiresAt,
    axiosInstance,
    (message) => notify({ severity: "error", message, key: "auth-error" }),
  );

  const onResend = () => {
    handleResend({ email }, mode);
  };

  return (
    <Stack
      sx={{
        gap: 1.5,
      }}
    >
      <Controller
        name="otp"
        control={control}
        render={({ field: { value, onChange }, formState: { errors } }) => (
          <Stack>
            <OtpInput value={value || ""} length={6} onChange={onChange} autoFocus />
            {get(errors, "otp")?.message && (
              <FormHelperText error>{get(errors, "otp").message}</FormHelperText>
            )}
          </Stack>
        )}
      />
      <OtpCountdown expiresAt={new Date(endTime)} />
      {!isResendDisabled && (
        <Typography
          color={theme.palette.text.secondary}
          sx={{
            fontSize: 15,
            alignSelf: "center",
          }}
        >
          Didn't get the Code?{" "}
          <Link
            component="button"
            type="button"
            underline="hover"
            disabled={isResendDisabled || isResending}
            onClick={onResend}
            sx={{
              cursor: isResending ? "not-allowed" : "pointer",
              color: isResending ? theme.palette.text.disabled : theme.palette.primary.main,
              fontWeight: 500,
            }}
          >
            Resend Code
          </Link>
        </Typography>
      )}
      <Button
        type={mode === "login" ? "submit" : "button"}
        size="large"
        variant="contained"
        onClick={mode === "signup" ? handleNext : undefined}
        loading={isPending}
      >
        {mode === "login" ? "Submit" : "Continue"}
      </Button>
    </Stack>
  );
}
