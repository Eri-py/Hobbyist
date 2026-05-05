import { useCallback } from "react";
import { FormProvider } from "react-hook-form";
import { type Href, useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { useSignUp } from "@hobbyist/hooks";
import { ThemedView } from "@/components/shared/ThemedView";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameEmailStep";
import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { PasswordStep } from "@/components/auth/sign-up/PasswordStep";
import { PersonalDetailsStep } from "@/components/auth/sign-up/PersonalDetailsStep";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { axiosInstance } from "@/api/axiosInstance";
import * as TokenManager from "@/api/tokenManager";
import type { components } from "@hobbyist/types";
import { FormHeader } from "@/components/auth/FormHeader";

type AuthResult = components["schemas"]["AuthResult"];

export default function SignUp() {
  const router = useRouter();
  const handleAuthSuccess = useCallback(async (authResult: AuthResult) => {
    await TokenManager.storeTokens(authResult);
  }, []);

  const {
    methods,
    step,
    setStep,
    otpExpiresAt,
    serverErrorMessage,
    handleNext,
    onSubmit,
    isStarting,
    isVerifying,
    isCompleting,
    signUpHeaderConfig,
    SIGNUP_TOTAL_STEPS,
  } = useSignUp((path: string) => router.push(path as Href), axiosInstance, handleAuthSuccess);

  return (
    <ThemedView safeArea mode="keyboard" contentContainerStyle={styles.container}>
      {/* Header */}
      <FormHeader
        header={signUpHeaderConfig[step].header}
        subtext={signUpHeaderConfig[step].subtext}
        currentStep={step}
        totalSteps={SIGNUP_TOTAL_STEPS}
      />

      <FormProvider {...methods}>
        {serverErrorMessage && <ErrorMessage>{serverErrorMessage}</ErrorMessage>}

        {step === 0 && <UsernameAndEmailStep handleNext={handleNext} isPending={isStarting} />}
        {step === 1 && otpExpiresAt && (
          <OtpStep
            mode="signup"
            email={methods.getValues("email")}
            intitialOtpExpiresAt={otpExpiresAt}
            handleNext={handleNext}
            handleBack={() => setStep(0)}
            isPending={isVerifying}
          />
        )}
        {step === 2 && <PasswordStep handleNext={handleNext} />}
        {step === 3 && (
          <PersonalDetailsStep onSubmit={methods.handleSubmit(onSubmit)} isPending={isCompleting} />
        )}
      </FormProvider>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
});
