import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useEffect } from "react";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@hobbyist/hooks";
import { useAppTheme } from "@/hooks/shared/useAppTheme";

const BackArrowButton = () => {
  const router = useRouter();
  const theme = useAppTheme();

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
      <Ionicons name="arrow-back-outline" size={28} color={theme.text} />
    </Pressable>
  );
};

export default function Layout() {
  const theme = useAppTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users away from auth routes
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  // Don't render auth screens if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerLeft: () => <BackArrowButton />,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: true, gestureEnabled: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: true, gestureEnabled: false }} />
    </Stack>
  );
}
