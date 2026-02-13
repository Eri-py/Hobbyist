import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useTheme } from "react-native-paper";

import Ionicons from "@expo/vector-icons/Ionicons";

const BackArrowButton = () => {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Pressable
      style={{
        width: 36,
        aspectRatio: 1 / 1,
        alignItems: "center",
        justifyContent: "center",
      }}
      onPress={() => router.replace("/")}
    >
      <Ionicons name="arrow-back-outline" size={28} color={theme.colors.onSurfaceVariant} />
    </Pressable>
  );
};

const AuthLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerLeft: () => <BackArrowButton />,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: true, gestureEnabled: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: true, gestureEnabled: false }} />
    </Stack>
  );
};
export default AuthLayout;
