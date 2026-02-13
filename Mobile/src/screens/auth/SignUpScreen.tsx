import { FormProvider } from "react-hook-form";
import { Href, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useSignUp } from "@hobbyist/hooks";
import { useMobileAxiosInstance } from "@/api/axiosInstance";
import { ThemedView } from "@/components/shared/ThemedView";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameEmailStep";
import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { PasswordStep } from "@/components/auth/sign-up/PasswordStep";
import { PersonalDetailsStep } from "@/components/auth/sign-up/PersonalDetailsStep";
import { FormHeader } from "@/components/auth/FormHeader";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useTokenStorage } from "@/hooks/auth/useTokenStorage";

export function SignUpScreen() {
  const router = useRouter();
  const { isTablet } = useDeviceType();
  const { onAuthSuccess } = useTokenStorage();
  const axiosInstance = useMobileAxiosInstance();
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
  } = useSignUp((path: string) => router.push(path as Href), axiosInstance, onAuthSuccess);

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
              header={signUpHeaderConfig[step].header}
              subtext={signUpHeaderConfig[step].subtext}
              currentStep={String(step + 1)}
              totalSteps={String(SIGNUP_TOTAL_STEPS)}
            />

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
              <PersonalDetailsStep
                onSubmit={methods.handleSubmit(onSubmit)}
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
