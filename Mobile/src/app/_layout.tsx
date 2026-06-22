import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ThemeProvider } from "@/providers/shared/ThemeProvider";
import { AuthProvider } from "@/providers/app/AuthProvider";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export default function AppLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SafeAreaProvider>
          <KeyboardProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" options={{ presentation: "formSheet" }} />
                <Stack.Screen
                  name="(create)"
                  options={{ presentation: "modal", gestureEnabled: false }}
                />
                <Stack.Screen name="(profile)" />
              </Stack>
            </AuthProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
