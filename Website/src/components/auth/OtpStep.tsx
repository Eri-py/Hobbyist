import { useState } from "react";
import { Controller, get, useFormContext } from "react-hook-form";
import Countdown, { zeroPad } from "react-countdown";
import type { AxiosResponse } from "axios";

import { useTheme } from "@mui/material/styles";
import { MuiOtpInput } from "mui-one-time-password-input";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import { CustomFormHeader } from "./CustomInputs";
import type { ResendOtpRequest, ResendOtpResponse } from "@/hooks/auth/useSignUp";

type OtpStepProps = {
  mode: "login" | "signup";
  email: string;
  username: string;
  intitialOtpExpiresAt: Date;
  handleNext?: () => void;
  handleBack: () => void;
  isPending: boolean;
  resendOtpAsync: (data: ResendOtpRequest) => Promise<AxiosResponse<ResendOtpResponse>>;
  isResending: boolean;
};

export function OtpStep({
  mode,
  email,
  username,
  intitialOtpExpiresAt,
  handleNext,
  handleBack,
  isPending,
  resendOtpAsync,
  isResending,
}: OtpStepProps) {
  const theme = useTheme();
  const { control } = useFormContext();
  const [endTime, setEndTime] = useState(intitialOtpExpiresAt.getTime());
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);

  const handleResend = async () => {
    const response = await resendOtpAsync({ email, username });
    const newEndTime = new Date(response.data.otpExpiresAt).getTime();
    setEndTime(newEndTime);
    setIsResendDisabled(true);

    setTimeout(
      () => {
        setIsResendDisabled(false);
      },
      (newEndTime - Date.now()) / 5
    );
  };

  return (
    <Stack gap="0.75rem" padding="1rem">
      <CustomFormHeader
        header="Verify email"
        subtext={
          <span>
            Enter the <b>6 digit code</b> sent to the email below <br />
            <b>{email?.toLowerCase()}.</b>
          </span>
        }
        align="flex-start"
      />

      <Controller
        name="otp"
        control={control}
        render={({ field: { value, onChange }, formState: { errors } }) => (
          <Stack>
            <MuiOtpInput
              value={value || ""}
              length={6}
              onChange={onChange}
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
        key={endTime}
        date={endTime}
        onStart={() => {
          setTimeout(
            () => {
              setIsResendDisabled(false);
            },
            (endTime - Date.now()) / 5
          );
        }}
        renderer={({ minutes, seconds, completed }) => {
          if (!completed) {
            return (
              <Typography
                fontSize="0.84375rem"
                color={theme.palette.text.secondary}
                textAlign="center"
              >
                Code expires in{" "}
                <b>
                  {zeroPad(minutes)}:{zeroPad(seconds)}
                </b>
              </Typography>
            );
          } else {
            return (
              <Typography fontSize="0.9375rem" color={theme.palette.error.main} textAlign="center">
                Code expired
              </Typography>
            );
          }
        }}
      />

      {!isResendDisabled && (
        <Typography fontSize="0.9375rem" color={theme.palette.text.secondary} alignSelf="center">
          Didn't get the Code?{" "}
          <Link
            component="button"
            type="button"
            underline="hover"
            disabled={isResending}
            onClick={handleResend}
            sx={{
              cursor: isResending ? "not-allowed" : "pointer",
              color: theme.palette.primary.main,
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
