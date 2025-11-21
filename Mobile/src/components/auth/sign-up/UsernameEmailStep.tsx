import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

import { FormInput } from "../FormInputs";
import { OAuthButtons } from "../OAuthButtons";
import { AuthFooter } from "../AuthFooter";

type UsernameAndEmailStepProps = {
  handleNext: () => void;
  isPending: boolean;
};

export function UsernameAndEmailStep({ handleNext, isPending }: UsernameAndEmailStepProps) {
  return (
    <View style={styles.container}>
      <FormInput name="username" label="Username" startIcon="account-circle" />

      <FormInput name="email" label="Email" startIcon="email" />

      <Button
        mode="contained"
        style={styles.continueButton}
        onPress={handleNext}
        loading={isPending}
      >
        Continue
      </Button>

      <OAuthButtons mode="sign-up" />

      <AuthFooter mode="sign-up" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  continueButton: {
    borderEndEndRadius: 8,
  },
});
