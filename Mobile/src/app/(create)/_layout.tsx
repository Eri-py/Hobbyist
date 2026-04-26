import { Redirect, Stack } from "expo-router";
import { useAppTheme } from "@/hooks/shared/useAppTheme";
import { useAuth } from "@hobbyist/hooks";

export default function CreateLayout() {
  const theme = useAppTheme();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="index" options={{ title: "Create" }} />
      </Stack.Protected>
    </Stack>
  );
}
