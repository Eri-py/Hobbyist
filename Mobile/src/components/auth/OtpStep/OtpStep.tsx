import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Controller, useFormContext, get } from "react-hook-form";
import OTPTextInput from "react-native-otp-textinput";

import { useOtp } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { ThemedButton } from "@/components/shared/ThemedButton";
import { OtpCountdown } from "./OtpCountdown";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

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
        render={({ field: { value, onChange }, formState: { errors } }) => (
          <View>
            <OTPTextInput
              inputCount={6}
              handleTextChange={onChange}
              keyboardType="default"
              defaultValue={value || ""}
              tintColor={theme.colors.primary}
              offTintColor={errors.otp ? theme.colors.error : theme.colors.outline}
              textInputStyle={
                {
                  color: theme.colors.onSurface,
                } as ViewStyle
              }
            />
            {get(errors, "otp")?.message && (
              <Text style={{ fontSize: 12, color: theme.colors.error, paddingLeft: 4 }}>
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
  errorText: {
    textAlign: "center",
    fontSize: 14,
  },
  resendContainer: {
    fontSize: 15,
    alignSelf: "center",
  },
  resendLink: {
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  textInput: {},
});
