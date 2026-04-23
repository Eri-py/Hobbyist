import { Drawer } from "expo-router/drawer";
import { Stack, usePathname, useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";

import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useAppTheme } from "@/hooks/shared/useAppTheme";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

export default function TabsLayout() {
  const theme = useAppTheme();
  const { isTablet } = useDeviceType();
  const router = useRouter();
  const pathname = usePathname();

  const isTradeActive = pathname.startsWith("/(tabs)/trade");
  const isSearchActive = pathname.startsWith("/(tabs)/search");

  if (isTablet) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Drawer
          screenOptions={{
            headerShown: false,
            drawerPosition: "left",
            drawerType: "permanent",
            drawerStyle: {
              backgroundColor: theme.background,
              width: 100,
              borderRightWidth: 0,
            },
            drawerContentStyle: {
              alignSelf: "center",
            },
            drawerActiveTintColor: theme.primary,
            drawerInactiveTintColor: theme.textSecondary,
            drawerActiveBackgroundColor: "transparent",
            drawerInactiveBackgroundColor: "transparent",
            drawerLabel: () => null,
          }}
          drawerContent={(props) => (
            <DrawerContentScrollView
              {...props}
              scrollEnabled={false}
              contentContainerStyle={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <DrawerItemList {...props} />
            </DrawerContentScrollView>
          )}
        >
          <Drawer.Screen
            name="index"
            options={{
              drawerIcon: ({ color }) => <Entypo name="home" size={28} color={color} />,
            }}
          />
          <Drawer.Screen
            name="search"
            options={{
              drawerIcon: ({ color }) => <Ionicons name="search" size={28} color={color} />,
            }}
          />
          <Drawer.Screen
            name="messages"
            options={{
              drawerIcon: ({ color }) => (
                <MaterialCommunityIcons name="message-text-outline" size={28} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="trade"
            options={{
              drawerIcon: ({ color }) => <MaterialIcons name="store" size={28} color={color} />,
            }}
          />
          <Drawer.Screen
            name="events"
            options={{
              drawerIcon: ({ color }) => <MaterialIcons name="event" size={28} color={color} />,
            }}
          />
          <Drawer.Screen
            name="create"
            options={{
              drawerIcon: ({ color }) => <Entypo name="plus" size={28} color={color} />,
            }}
          />

          <Drawer.Screen
            name="profile"
            options={{
              drawerIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
            }}
          />
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTitle: "",
          unstable_headerLeftItems: () => [
            {
              type: "button",
              label: "Trade",
              icon: {
                type: "sfSymbol",
                name: isTradeActive ? "bag.fill" : "bag",
              },
              selected: isTradeActive,
              onPress: () => router.push("/(tabs)/trade"),
              accessibilityLabel: "Open trade",
            },
          ],
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Search",
              icon: {
                type: "sfSymbol",
                name: "magnifyingglass",
              },
              selected: isSearchActive,
              onPress: () => router.push("/(tabs)/search"),
              accessibilityLabel: "Open search",
            },
          ],
        }}
      />
      <NativeTabs
        minimizeBehavior="onScrollDown"
        tintColor={theme.primary}
        iconColor={{ default: theme.textSecondary, selected: theme.primary }}
        labelStyle={{ color: theme.textSecondary }}
        backgroundColor={theme.background}
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="events">
          <NativeTabs.Trigger.Label>Events</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "calendar", selected: "calendar.circle.fill" }} />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="create">
          <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="messages">
          <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "message", selected: "message.fill" }} />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} />
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
