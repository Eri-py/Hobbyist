import { FormProvider } from "react-hook-form";
import { Href, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";
import { HelperText } from "react-native-paper";

import { useSignUp } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { ThemedView } from "@/components/shared/ThemedView";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameEmailStep";
import { OtpStep } from "@/components/auth/OtpStep/OtpStep";
import { PasswordStep } from "@/components/auth/sign-up/PasswordStep";
import { PersonalDetailsStep } from "@/components/auth/sign-up/PersonalDetailsStep";
import { FormHeader } from "@/components/auth/FormHeader";

export function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  } = useSignUp((path: string) => router.push(path as Href), axiosInstance);

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
