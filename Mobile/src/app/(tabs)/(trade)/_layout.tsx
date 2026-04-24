import { Stack, useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/shared/useAppTheme";

export default function TradeLayout() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Trade",
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
