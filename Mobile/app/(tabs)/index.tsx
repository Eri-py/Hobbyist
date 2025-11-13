import { Link } from "expo-router";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView>
      <Text>Home</Text>
      <Link href="/(auth)/login">Navigate to login route</Link>
      <Link href="/(auth)/sign-up">Navigate to sign-up route</Link>
    </SafeAreaView>
  );
}
