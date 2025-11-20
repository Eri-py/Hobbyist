import { View } from "react-native";
import { Button } from "react-native-paper";

import { FormHeader } from "../FormHeader";
import { FormInput } from "../FormInputs";
import { OAuthButtons } from "../OAuthButtons";
import { AuthFooter } from "../AuthFooter";

export function UsernameAndEmailStep() {
  return (
    <View style={{ gap: 16 }}>
      <FormHeader header="Sign up" subtext="Welcome to Hobbyist!" align="flex-start" />

      <FormInput name="username" label="Username" icon="account-circle" />

      <FormInput name="email" label="Email" icon="email" />

      <Button mode="contained" style={{ borderRadius: 8 }}>
        Continue
      </Button>

      <OAuthButtons mode="sign-up" />

      <AuthFooter mode="sign-up" />
    </View>
  );
}
