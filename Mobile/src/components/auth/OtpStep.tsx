import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Text, useTheme, HelperText } from "react-native-paper";
import { Controller, useFormContext, get } from "react-hook-form";
import OTPTextInput from "react-native-otp-textinput";

import { useOtp } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { ThemedButton } from "../shared/ThemedButton";

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
  const { isResendDisabled, handleResend, isResending, serverErrorMessage } = useOtp(
    intitialOtpExpiresAt,
    axiosInstance
  );

  const onResend = () => {
    handleResend({ email }, mode);
  };

  return (
    <View style={styles.container}>
      {serverErrorMessage && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{serverErrorMessage}</Text>
      )}

      <Controller
        name="otp"
        control={control}
        render={({ field: { value, onChange }, formState: { errors } }) => (
          <View>
            <OTPTextInput
              inputCount={6}
              handleTextChange={onChange}
              defaultValue={value || ""}
              keyboardType="numeric"
              autoFocus
              tintColor={theme.colors.primary}
              offTintColor={errors.otp ? theme.colors.error : theme.colors.outline}
              textInputStyle={
                {
                  color: theme.colors.onSurface,
                } as ViewStyle
              }
            />
            {get(errors, "otp")?.message && (
              <HelperText type="error" visible={!!errors.otp}>
                {get(errors, "otp")?.message}
              </HelperText>
            )}
          </View>
        )}
      />

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
});
