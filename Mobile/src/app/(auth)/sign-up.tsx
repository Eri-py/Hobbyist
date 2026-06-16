import { useCallback, useState } from "react";
import { FormProvider } from "react-hook-form";
import { type Href, useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { useSignUp } from "@hobbyist/hooks";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameEmailStep";
import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { PasswordStep } from "@/components/auth/sign-up/PasswordStep";
import { PersonalDetailsStep } from "@/components/auth/sign-up/PersonalDetailsStep";
import { InterestsStep } from "@/components/auth/sign-up/InterestsStep";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { axiosInstance } from "@/api/axiosInstance";
import * as TokenManager from "@/api/tokenManager";
import type { components } from "@hobbyist/types";
import { FormHeader } from "@/components/auth/FormHeader";
import { ThemedKeyboardView } from "@/components/shared/views/ThemedKeyboardView";

type AuthResult = components["schemas"]["AuthResult"];

export default function SignUp() {
  const router = useRouter();
  const handleAuthSuccess = useCallback(async (authResult: AuthResult) => {
    await TokenManager.storeTokens(authResult);
  }, []);

  const [serverError, setServerError] = useState<string | null>(null);
  const {
    methods,
    step,
    otpExpiresAt,
    handleNext,
    onSubmit,
    isStarting,
    isVerifying,
    isCompleting,
    popularInterests,
    signUpHeaderConfig,
    SIGNUP_TOTAL_STEPS,
  } = useSignUp(
    { replace: (path: string) => router.replace(path as Href) },
    axiosInstance,
    handleAuthSuccess,
    (message) => setServerError(message),
  );

  return (
    <ThemedKeyboardView safeArea contentContainerStyle={styles.container}>
      {/* Header */}
      <FormHeader
        header={signUpHeaderConfig[step].header}
        subtext={signUpHeaderConfig[step].subtext}
        currentStep={step}
        totalSteps={SIGNUP_TOTAL_STEPS}
      />

      <FormProvider {...methods}>
        {serverError && <ErrorMessage>{serverError}</ErrorMessage>}

        {step === 0 && <UsernameAndEmailStep handleNext={handleNext} isPending={isStarting} />}
        {step === 1 && otpExpiresAt && (
          <OtpStep
            mode="signup"
            email={methods.getValues("email")}
            intitialOtpExpiresAt={otpExpiresAt}
            handleNext={handleNext}
            isPending={isVerifying}
          />
        )}
        {step === 2 && <PasswordStep handleNext={handleNext} />}
        {step === 3 && <PersonalDetailsStep handleNext={handleNext} />}
        {step === 4 && (
          <InterestsStep
            popularInterests={popularInterests}
            onSubmit={methods.handleSubmit(onSubmit)}
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
    gap: 16,
  },
});
