import { Stack, useRouter } from "expo-router";
import { useTheme } from "react-native-paper";

export default function EventsLayout() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Events",
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Add",
              icon: { type: "sfSymbol", name: "plus" },
              onPress: () => router.push("/(create)"),
            },
          ],
          unstable_headerLeftItems: () => [
            {
              type: "button",
              label: "Profile",
              icon: { type: "sfSymbol", name: "person" },
              onPress: () => router.push("/(profile)"),
            },
          ],
        }}
      />
    </Stack>
  );
}
