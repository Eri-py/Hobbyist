import { useAppTheme } from "@/hooks/shared/useAppTheme";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  const theme = useAppTheme();
  const { isTablet } = useDeviceType();
  return (
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
        <NativeTabs.Trigger.Icon sf={{ default: "calendar", selected: "calendar.circle.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(messages)" role={isTablet ? undefined : "search"}>
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "message", selected: "message.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
