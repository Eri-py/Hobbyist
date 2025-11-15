import { Tabs } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useTheme } from "react-native-paper";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";

import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";

import { DefaultLeftButton } from "@/components/shared/DefaultLeftButton";
import { DefaultRightButton } from "@/components/shared/DefaultRightButton";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

export default function TabsLayout() {
  const theme = useTheme();
  const { isTablet } = useDeviceType();

  if (isTablet) {
    return (
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerPosition: "left",
          drawerType: "permanent",
          drawerStyle: {
            backgroundColor: theme.colors.background,
            width: 100,
            borderRightWidth: 0,
          },
          drawerContentStyle: {
            alignSelf: "center",
          },
          drawerActiveTintColor: theme.colors.primary,
          drawerInactiveTintColor: theme.colors.onSurfaceVariant,
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
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: `${theme.colors.primary}25`,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarShowLabel: false,
        tabBarIconStyle: {
          alignItems: "center",
          justifyContent: "center",
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomWidth: 0.25,
          borderBottomColor: `${theme.colors.primary}25`,
        },
        headerLeftContainerStyle: {
          paddingHorizontal: 10,
        },
        headerRightContainerStyle: {
          paddingHorizontal: 10,
        },
        headerTitle: "",
        headerLeft: () => <DefaultLeftButton />,
        headerRight: () => <DefaultRightButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Entypo name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color }) => <MaterialIcons name="event" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => <Entypo name="plus" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="message-text-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
