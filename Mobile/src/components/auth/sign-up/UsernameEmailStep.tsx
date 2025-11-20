import { View } from "react-native";
import { Button } from "react-native-paper";

import { FormHeader } from "../FormHeader";
import { FormInput } from "../FormInputs";
import { OAuthButtons } from "../OAuthButtons";
import { AuthFooter } from "../AuthFooter";

type UsernameAndEmailStepProps = {
  handleNext: () => void;
  isPending: boolean;
};

export function UsernameAndEmailStep({ handleNext, isPending }: UsernameAndEmailStepProps) {
  return (
    <View style={{ gap: 16 }}>
      <FormHeader header="Sign up" subtext="Welcome to Hobbyist!" align="flex-start" />

      <FormInput name="username" label="Username" startIcon="account-circle" />

      <FormInput name="email" label="Email" startIcon="email" />

      <Button mode="contained" style={{ borderRadius: 8 }} onPress={handleNext} loading={isPending}>
        Continue
      </Button>

      <OAuthButtons mode="sign-up" />

      <AuthFooter mode="sign-up" />
    </View>
  );
}
