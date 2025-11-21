import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";

import { FormInput } from "../FormInputs";
import { OAuthButtons } from "../OAuthButtons";
import { AuthFooter } from "../AuthFooter";

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
      />

      <FormInput name="password" label="Password" startIcon="lock" autoComplete="off" />

      <Button mode="contained" onPress={handleNext} loading={isPending} style={{ borderRadius: 8 }}>
        Continue
      </Button>

      <OAuthButtons mode="login" />

      <AuthFooter mode="login" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
