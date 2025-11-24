import { StyleSheet, View } from "react-native";

import { FormInput } from "../FormInputs";
import { OAuthButtons } from "../OAuthButtons";
import { AuthFooter } from "../AuthFooter";
import { ThemedButton } from "@/components/shared/ThemedButton";

type UsernameAndEmailStepProps = {
  handleNext: () => void;
  isPending: boolean;
};

export function UsernameAndEmailStep({ handleNext, isPending }: UsernameAndEmailStepProps) {
  return (
    <View style={styles.container}>
      <FormInput name="username" label="Username" startIcon="account-circle" />

      <FormInput name="email" label="Email" startIcon="email" />

      <ThemedButton mode="contained" onPress={handleNext} loading={isPending}>
        Continue
      </ThemedButton>

      <OAuthButtons mode="sign-up" />

      <AuthFooter mode="sign-up" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
