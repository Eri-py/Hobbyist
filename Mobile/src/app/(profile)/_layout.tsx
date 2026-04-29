import { Redirect, Stack } from "expo-router";
import { useTheme } from "react-native-paper";

import { useAuth } from "@hobbyist/hooks";

export default function ProfileLayout() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" options={{ title: "Profile" }} />
      </Stack.Protected>
    </Stack>
  );
}
