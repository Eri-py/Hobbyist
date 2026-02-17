import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Controller, useFormContext, get } from "react-hook-form";
import { OtpInput } from "react-native-otp-entry";

import { useOtp } from "@hobbyist/hooks";
import { ThemedButton } from "@/components/shared/ThemedButton";
import { OtpCountdown } from "./OtpCountdown";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { axiosInstance } from "@/api/axiosInstance";

type OtpStepProps = {
  mode: "login" | "signup";
  email: string;
  intitialOtpExpiresAt: Date;
  handleNext?: () => void;
  handleSubmit?: () => void;
  handleBack: () => void;
  isPending: boolean;
};

export function OtpStep({
  mode,
  email,
  intitialOtpExpiresAt,
  handleNext,
  handleSubmit,
  handleBack,
  isPending,
}: OtpStepProps) {
  const theme = useTheme();
  const { control } = useFormContext();
  const { endTime, isResendDisabled, handleResend, isResending, serverErrorMessage } = useOtp(
    intitialOtpExpiresAt,
    axiosInstance,
  );

  const onResend = () => {
    handleResend({ email }, mode);
  };

  return (
    <View style={styles.container}>
      {serverErrorMessage && <ErrorMessage>{serverErrorMessage}</ErrorMessage>}

      <Controller
        name="otp"
        control={control}
        render={({ field: { onChange }, formState: { errors } }) => (
          <View>
            <OtpInput
              numberOfDigits={6}
              onTextChange={onChange}
              focusColor={theme.colors.primary}
              theme={{
                containerStyle: styles.otpContainer,
                pinCodeContainerStyle: {
                  ...styles.otpBox,
                  borderColor: errors.otp ? theme.colors.error : theme.colors.outline,
                },
                pinCodeTextStyle: {
                  ...styles.otpText,
                  color: theme.colors.onSurface,
                },
                focusStickStyle: {
                  ...styles.focusStick,
                  backgroundColor: theme.colors.primary,
                },
              }}
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

      <ThemedButton mode="outlined" onPress={handleBack}>
        Back
      </ThemedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  otpContainer: {
    gap: 8,
  },
  otpBox: {
    borderWidth: 1,
    borderRadius: 10,
    width: 44,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  otpText: {
    fontSize: 18,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  focusStick: {
    backgroundColor: "transparent",
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
