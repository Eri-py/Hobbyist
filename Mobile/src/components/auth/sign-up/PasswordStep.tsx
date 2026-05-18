import { StyleSheet, View } from "react-native";
import { useFormContext, useWatch } from "react-hook-form";

import { FormInput } from "../FormInputs";
import { PasswordRequirements } from "./PasswordRequirements";
import { ThemedButton } from "@/components/shared/ThemedButton";

type PasswordStepProps = {
  handleNext: () => void;
};

export function PasswordStep({ handleNext }: PasswordStepProps) {
  const { control } = useFormContext();
  const password = useWatch({ control, name: "password" }) || "";

  return (
    <View style={styles.container}>
      <FormInput
        name="password"
        label="Password"
        type="password"
        startIcon="lock"
        autoComplete="new-password"
        autoFocus
      />

      <PasswordRequirements password={password} />

      <FormInput
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        startIcon="lock"
        autoComplete="new-password"
      />

      <ThemedButton mode="contained" onPress={handleNext}>
        Continue
      </ThemedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
