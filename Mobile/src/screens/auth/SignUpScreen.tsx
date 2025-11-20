import { FormProvider } from "react-hook-form";
import { Href, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSignUp } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { ThemedView } from "@/components/shared/ThemedView";
import { UsernameAndEmailStep } from "@/components/auth/sign-up/UsernameEmailStep";

export function SignUpScreen() {
  const router = useRouter();
  const inset = useSafeAreaInsets();
  const { methods, step, handleNext, isStarting } = useSignUp(
    (path: string) => router.push(path as Href),
    axiosInstance
  );

  return (
    <ThemedView
      style={{
        paddingTop: inset.top,
        paddingBottom: inset.bottom,
        paddingInline: 16,
      }}
    >
      <FormProvider {...methods}>
        {step === 0 && <UsernameAndEmailStep handleNext={handleNext} isPending={isStarting} />}
      </FormProvider>
    </ThemedView>
  );
}
