import { FormProvider } from "react-hook-form";
import { Href, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSignUp } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { ThemedView } from "@/components/shared/ThemedView";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameEmailStep";
import { FormHeader } from "@/components/auth/FormHeader";
import { View } from "react-native";

export function SignUpScreen() {
  const router = useRouter();
  const inset = useSafeAreaInsets();
  const { methods, step, handleNext, isStarting, signUpHeaderConfig, SIGNUP_TOTAL_STEPS } =
    useSignUp((path: string) => router.push(path as Href), axiosInstance);

  return (
    <ThemedView
      style={{
        paddingTop: inset.top,
        paddingBottom: inset.bottom,
        paddingInline: 16,
      }}
    >
      <FormProvider {...methods}>
        <View style={{ gap: 16 }}>
          <FormHeader
            header={signUpHeaderConfig[step].header}
            subtext={signUpHeaderConfig[step].subtext}
            currentStep={String(step + 1)}
            totalSteps={String(SIGNUP_TOTAL_STEPS)}
          />

          {step === 0 && <UsernameAndEmailStep handleNext={handleNext} isPending={isStarting} />}
        </View>
      </FormProvider>
    </ThemedView>
  );
}
