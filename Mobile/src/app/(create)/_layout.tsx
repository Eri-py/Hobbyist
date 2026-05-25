import { Redirect, Stack } from "expo-router";
import { FormProvider } from "react-hook-form";
import { useTheme } from "react-native-paper";

import { useAuth } from "@hobbyist/hooks";
import { useCreate, CreateContext } from "@/hooks/create/useCreate";

export default function CreateLayout() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const createValue = useCreate();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <CreateContext.Provider value={createValue}>
      <FormProvider {...createValue.methods}>
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
              sheetAllowedDetents: [1],
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.onSurface,
              headerShadowVisible: false,
            }}
          />
        </Stack>
      </FormProvider>
    </CreateContext.Provider>
  );
}
