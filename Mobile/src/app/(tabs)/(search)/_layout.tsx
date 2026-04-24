import { Stack } from "expo-router";
import { useAppTheme } from "@/hooks/shared/useAppTheme";

export default function SearchLayout() {
  const theme = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Search" }} />
    </Stack>
  );
}
