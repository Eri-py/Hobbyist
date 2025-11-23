import { Controller, get, useFormContext } from "react-hook-form";
import Countdown, { zeroPad } from "react-countdown";

import { useTheme } from "@mui/material/styles";
import { MuiOtpInput } from "mui-one-time-password-input";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import { useOtp } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";

type OtpStepProps = {
  mode: "login" | "signup";
  email: string;
  intitialOtpExpiresAt: Date;
  handleNext?: () => void;
  handleBack: () => void;
  isPending: boolean;
};

export function OtpStep({
  mode,
  email,
  intitialOtpExpiresAt,
  handleNext,
  handleBack,
  isPending,
}: OtpStepProps) {
  const theme = useTheme();
  const { control } = useFormContext();
  const { endTime, isResendDisabled, handleResend, isResending, serverErrorMessage } = useOtp(
    intitialOtpExpiresAt,
    axiosInstance
  );

  const onResend = () => {
    handleResend({ email }, mode);
  };

  return (
    <Stack gap={1.5}>
      {serverErrorMessage && (
        <Typography color="error" textAlign="center" fontSize={14}>
          {serverErrorMessage}
        </Typography>
      )}

      <Controller
        name="otp"
        control={control}
        render={({ field: { value, onChange }, formState: { errors } }) => (
          <Stack>
            <MuiOtpInput
              value={value || ""}
              length={6}
              onChange={onChange}
              autoFocus
              TextFieldsProps={{
                slotProps: {
                  htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
                },
              }}
            />
            {get(errors, "otp")?.message && (
              <FormHelperText error>{get(errors, "otp").message}</FormHelperText>
            )}
          </Stack>
        )}
      />

      <Countdown
        date={endTime}
        renderer={({ minutes, seconds, completed }) => {
          if (!completed) {
            return (
              <Typography fontSize={15} color={theme.palette.text.secondary} textAlign="center">
                Code expires in{" "}
                <b>
                  {zeroPad(minutes)}:{zeroPad(seconds)}
                </b>
              </Typography>
            );
          } else {
            return (
              <Typography fontSize={15} color={theme.palette.error.main} textAlign="center">
                Code expired
              </Typography>
            );
          }
        }}
      />

      {!isResendDisabled && (
        <Typography fontSize={15} color={theme.palette.text.secondary} alignSelf="center">
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

      <Button variant="outlined" type="button" size="large" onClick={handleBack}>
        Back
      </Button>
    </Stack>
  );
}
