import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Controller, useFormContext, get } from "react-hook-form";

import { useOtp } from "@hobbyist/hooks";
import { ThemedButton } from "@/components/shared/ThemedButton";
import { OtpCountdown } from "./OtpCountdown";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { axiosInstance } from "@/api/axiosInstance";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { OtpInput } from "./OtpInput";

type OtpStepProps = {
  mode: "login" | "signup";
  email: string;
  intitialOtpExpiresAt: Date;
  handleNext?: () => void;
  handleSubmit?: () => void;
  isPending: boolean;
};

export function OtpStep({
  mode,
  email,
  intitialOtpExpiresAt,
  handleNext,
  handleSubmit,
  isPending,
}: OtpStepProps) {
  const theme = useTheme();
  const { control } = useFormContext();
  const { isTablet } = useDeviceType();
  const [serverError, setServerError] = useState<string | null>(null);
  const { endTime, isResendDisabled, handleResend, isResending } = useOtp(
    intitialOtpExpiresAt,
    axiosInstance,
    (message) => setServerError(message),
  );

  const onResend = () => {
    handleResend({ email }, mode);
  };

  return (
    <View style={styles.container}>
      {serverError && <ErrorMessage>{serverError}</ErrorMessage>}

      <Controller
        name="otp"
        control={control}
        render={({ field: { value, onChange }, formState: { errors } }) => (
          <View>
            <OtpInput
              value={value || ""}
              length={6}
              onChange={onChange}
              mode={isTablet ? "alphanumeric" : "numeric"}
              hasError={Boolean(errors.otp)}
              autoFocus
            />
            {get(errors, "otp")?.message && (
              <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
                {get(errors, "otp")?.message}
              </Text>
            )}
          </View>
        )}
      />

      <OtpCountdown expiresAt={new Date(endTime)} />

      {!isResendDisabled && (
        <Text style={[styles.resendContainer, { color: theme.colors.onSurfaceVariant }]}>
          {"Didn't get the Code?"}{" "}
          <Text
            onPress={isResendDisabled || isResending ? undefined : onResend}
            style={[
              styles.resendLink,
              {
                color: isResending ? theme.colors.onSurfaceDisabled : theme.colors.primary,
              },
            ]}
          >
            Resend Code
          </Text>
        </Text>
      )}

      <ThemedButton
        mode="contained"
        onPress={mode === "signup" ? handleNext : handleSubmit}
        loading={isPending}
      >
        {mode === "login" ? "Submit" : "Continue"}
      </ThemedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  errorMessage: {
    fontSize: 12,
    paddingLeft: 4,
  },
  resendContainer: {
    fontSize: 15,
    alignSelf: "center",
  },
  resendLink: {
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
