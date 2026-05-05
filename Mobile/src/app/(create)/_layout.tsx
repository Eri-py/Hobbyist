import { Redirect, Stack } from "expo-router";

import { useAuth } from "@hobbyist/hooks";

export default function CreateLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" options={{ title: "Create" }} />
      </Stack.Protected>
    </Stack>
  );
}
