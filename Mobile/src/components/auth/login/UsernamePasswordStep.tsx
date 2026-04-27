import { View, StyleSheet } from "react-native";

import { FormInput } from "../FormInputs";
import { AuthFooter } from "../AuthFooter";
import { ThemedButton } from "@/components/shared/ThemedButton";

type UsernameAndPasswordStepProps = {
  handleNext: () => void;
  isPending: boolean;
};

export function UsernameAndPasswordStep({ handleNext, isPending }: UsernameAndPasswordStepProps) {
  return (
    <View style={styles.container}>
      <FormInput
        name="identifier"
        label="Username or Email"
        startIcon="account-circle"
        autoComplete="email"
        autoFocus
      />

      <FormInput
        name="password"
        label="Password"
        type="password"
        startIcon="lock"
        autoComplete="off"
      />

      <ThemedButton mode="contained" onPress={handleNext} loading={isPending}>
        Continue
      </ThemedButton>

      <AuthFooter mode="login" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
