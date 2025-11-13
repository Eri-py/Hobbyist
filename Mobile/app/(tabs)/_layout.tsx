import React from "react";
import { Tabs } from "expo-router";

const TabsLayout = () => {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ headerShown: false, title: "Home" }} />
      <Tabs.Screen name="events" options={{ headerShown: false, title: "Events" }} />
      <Tabs.Screen name="create" options={{ headerShown: false, title: "Create" }} />
      <Tabs.Screen name="messages" options={{ headerShown: false, title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ headerShown: false, title: "Profile" }} />
    </Tabs>
  );
};

export default TabsLayout;
