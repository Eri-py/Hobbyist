import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useRouter, Href } from "expo-router";
import { FormProvider } from "react-hook-form";

import { axiosInstance } from "@/api/axiosInstance";
import { useLogin } from "@hobbyist/hooks";
import * as TokenManager from "@/api/tokenManager";
import type { components } from "@hobbyist/types";
import { UsernameAndPasswordStep } from "@/components/auth/login/UsernamePasswordStep";
import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { FormHeader } from "@/components/auth/FormHeader";
import { ThemedKeyboardView } from "@/components/shared/views/ThemedKeyboardView";

type AuthResult = components["schemas"]["AuthResult"];

export default function Login() {
  const handleAuthSuccess = useCallback(async (authResult: AuthResult) => {
    await TokenManager.storeTokens(authResult);
  }, []);
  const router = useRouter();
  const {
    methods,
    step,
    loginHeaderConfig,
    LOGIN_TOTAL_STEPS,
    handleNext,
    isStarting,
    otpData,
    onSubmit,
    isCompleting,
    serverErrorMessage,
  } = useLogin((path: string) => router.push(path as Href), axiosInstance, handleAuthSuccess);

  return (
    <ThemedKeyboardView safeArea contentContainerStyle={styles.container}>
      {/* Header */}
      <FormHeader
        header={loginHeaderConfig[step].header}
        subtext={loginHeaderConfig[step].subtext}
        currentStep={step}
        totalSteps={LOGIN_TOTAL_STEPS}
      />

      {/* Form content */}
      <FormProvider {...methods}>
        {serverErrorMessage && <ErrorMessage>{serverErrorMessage}</ErrorMessage>}

        {step === 0 && <UsernameAndPasswordStep handleNext={handleNext} isPending={isStarting} />}
        {step === 1 && otpData && (
          <OtpStep
            mode="login"
            email={otpData.email}
            intitialOtpExpiresAt={new Date(otpData.otpExpiresAt)}
            handleSubmit={methods.handleSubmit(onSubmit)}
            isPending={isCompleting}
          />
        )}
      </FormProvider>
    </ThemedKeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
