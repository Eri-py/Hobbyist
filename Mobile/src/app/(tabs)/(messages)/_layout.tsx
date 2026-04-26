import { Stack } from "expo-router";
import { useAppTheme } from "@/hooks/shared/useAppTheme";

export default function MessagesLayout() {
  const theme = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Messages" }} />
    </Stack>
  );
}
