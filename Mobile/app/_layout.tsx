import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider } from "@/providers/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
