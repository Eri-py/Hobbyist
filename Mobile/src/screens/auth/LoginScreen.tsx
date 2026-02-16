import { useCallback } from "react";
import { Href, useRouter } from "expo-router";
import { FormProvider } from "react-hook-form";
import { View, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { ThemedView } from "@/components/shared/ThemedView";
import { useLogin } from "@hobbyist/hooks";
import { UsernameAndPasswordStep } from "@/components/auth/login/UsernamePasswordStep";
import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { FormHeader } from "@/components/auth/FormHeader";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { axiosInstance } from "@/api/axiosInstance";
import * as TokenManager from "@/api/tokenManager";
import type { components } from "@hobbyist/types";

type AuthResult = components["schemas"]["AuthResult"];

export function LoginScreen() {
  const handleAuthSuccess = useCallback(async (authResult: AuthResult) => {
    await TokenManager.storeTokens(authResult);
  }, []);

  const router = useRouter();
  const { isTablet } = useDeviceType();
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
  } = useLogin((path: string) => router.push(path as Href), axiosInstance, handleAuthSuccess);

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: isTablet ? 36 : 12,
        },
      ]}
    >
      <FormProvider {...methods}>
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {serverErrorMessage && <ErrorMessage>{serverErrorMessage}</ErrorMessage>}

            <FormHeader
              header={loginHeaderConfig[step].header}
              subtext={loginHeaderConfig[step].subtext}
              currentStep={String(step + 1)}
              totalSteps={String(LOGIN_TOTAL_STEPS)}
            />

            {step === 0 && (
              <UsernameAndPasswordStep handleNext={handleNext} isPending={isStarting} />
            )}
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
        </KeyboardAwareScrollView>
      </FormProvider>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  formContainer: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    gap: 16,
  },
});
