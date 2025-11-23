import React from "react";
import { Href, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormProvider } from "react-hook-form";
import { HelperText } from "react-native-paper";
import { View, StyleSheet } from "react-native";

import { ThemedView } from "@/components/shared/ThemedView";
import { useLogin } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { UsernameAndPasswordStep } from "@/components/auth/login/UsernamePasswordStep";
import { OtpStep } from "@/components/auth/OtpStep";
import { FormHeader } from "@/components/auth/FormHeader";

export function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    methods,
    step,
    setStep,
    otpData,
    serverErrorMessage,
    handleNext,
    onSubmit,
    isStarting,
    isCompleting,
    loginHeaderConfig,
    LOGIN_TOTAL_STEPS,
  } = useLogin((path: string) => router.push(path as Href), axiosInstance);

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {serverErrorMessage && <HelperText type="error">{serverErrorMessage}</HelperText>}
      <FormProvider {...methods}>
        <View style={styles.formContainer}>
          <FormHeader
            header={loginHeaderConfig[step].header}
            subtext={loginHeaderConfig[step].subtext}
            currentStep={String(step + 1)}
            totalSteps={String(LOGIN_TOTAL_STEPS)}
          />

          {step === 0 && <UsernameAndPasswordStep handleNext={handleNext} isPending={isStarting} />}
          {step === 1 && otpData && (
            <OtpStep
              mode="login"
              email={otpData.email}
              intitialOtpExpiresAt={new Date(otpData.otpExpiresAt)}
              handleBack={() => setStep(0)}
              handleSubmit={methods.handleSubmit(onSubmit)}
              isPending={isCompleting}
            />
          )}
        </View>
      </FormProvider>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  formContainer: {
    gap: 16,
  },
});
