import { Text } from "react-native-paper";

import { ThemedView } from "@/components/shared/ThemedView";
import { ThemedLink } from "@/components/shared/ThemedLink";

export default function Index() {
  return (
    <ThemedView>
      <Text>Home</Text>
      <ThemedLink href="/(auth)/login">Navigate to login route</ThemedLink>
      <ThemedLink href="/(auth)/sign-up">Navigate to sign-up route</ThemedLink>
    </ThemedView>
  );
}
