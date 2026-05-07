import { Redirect, Stack } from "expo-router";
import { useTheme } from "react-native-paper";

import { useAuth } from "@hobbyist/hooks";
import { useCreate } from "@/hooks/create/useCreate";
import { CreateContext } from "@/hooks/create/CreateContext";

export default function CreateLayout() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const createValue = useCreate();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <CreateContext.Provider value={createValue}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{
            title: "New Post",
            headerShown: true,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.onSurface,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="hobby"
          options={{
            presentation: "formSheet",
            title: "Choose a hobby",
            headerShown: true,
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.5, 1],
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.onSurface,
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </CreateContext.Provider>
  );
}
