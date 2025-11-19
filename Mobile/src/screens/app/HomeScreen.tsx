import { Button, Text } from "react-native-paper";

import { ThemedView } from "@/components/shared/ThemedView";
import { ThemedLink } from "@/components/shared/ThemedLink";
import { axiosInstance } from "@/api/axiosInstance";

const pingBackend = () => {
  return axiosInstance.get("test/ping");
};

const HomeScreen = () => {
  return (
    <ThemedView>
      <Text>Home</Text>
      <Button mode="outlined" onPress={pingBackend}>
        Ping Backend
      </Button>
      <ThemedLink href="/(auth)/sign-up">Navigate to sign-up route</ThemedLink>
    </ThemedView>
  );
};

export default HomeScreen;
