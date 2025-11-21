import React from "react";
import { View } from "react-native";
import { Text, Button, useTheme, HelperText } from "react-native-paper";
import { Controller, useFormContext, get } from "react-hook-form";
import OTPTextInput from "react-native-otp-textinput";

import { useOtp } from "@hobbyist/hooks";
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
  const { isResendDisabled, handleResend, isResending, serverErrorMessage } = useOtp(
    intitialOtpExpiresAt,
    axiosInstance
  );

  const onResend = () => {
    handleResend({ email }, mode);
  };

  return (
    <View style={{ gap: 12 }}>
      {serverErrorMessage && (
        <Text style={{ color: theme.colors.error, textAlign: "center", fontSize: 14 }}>
          {serverErrorMessage}
        </Text>
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
        <Text style={{ fontSize: 15, color: theme.colors.onSurfaceVariant, alignSelf: "center" }}>
          {"Didn't get the Code?"}{" "}
          <Text
            onPress={isResendDisabled || isResending ? undefined : onResend}
            style={{
              color: isResending ? theme.colors.onSurfaceDisabled : theme.colors.primary,
              fontWeight: "500",
              textDecorationLine: "underline",
            }}
          >
            Resend Code
          </Text>
        </Text>
      )}

      <Button
        mode="contained"
        onPress={mode === "signup" ? handleNext : handleSubmit}
        loading={isPending}
        style={{ marginTop: 8 }}
      >
        {mode === "login" ? "Submit" : "Continue"}
      </Button>

      <Button mode="outlined" onPress={handleBack}>
        Back
      </Button>
    </View>
  );
}
