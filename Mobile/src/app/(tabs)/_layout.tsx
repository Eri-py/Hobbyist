import { useColorScheme } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";

import { useAppTheme } from "@/hooks/shared/useAppTheme";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useAuth } from "@hobbyist/hooks";

export default function TabsLayout() {
  const theme = useAppTheme();
  const { isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const { isTablet } = useDeviceType();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <NativeTabs
        minimizeBehavior="onScrollDown"
        tintColor={theme.primary}
        iconColor={{ default: theme.textSecondary, selected: theme.primary }}
        labelStyle={{ color: theme.textSecondary }}
        backgroundColor={theme.background}
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(trade)">
          <NativeTabs.Trigger.Label>Trade</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "bag", selected: "bag.fill" }} />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(events)">
          <NativeTabs.Trigger.Label>Events</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "calendar", selected: "calendar" }} />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(messages)" hidden={!isAuthenticated}>
          <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "message", selected: "message.fill" }} />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(search)" role={isTablet ? undefined : "search"}>
          <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "magnifyingglass", selected: "magnifyingglass" }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
