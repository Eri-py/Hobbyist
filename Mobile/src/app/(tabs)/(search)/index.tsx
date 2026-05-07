import { Text } from "react-native-paper";
import { Stack } from "expo-router";

import { ThemedView } from "@/components/shared/views/ThemedView";
import { useDeviceType } from "@/hooks/shared/useDeviceType";

export default function SearchIndex() {
  const { isTablet } = useDeviceType();
  return (
    <>
      <Stack.SearchBar
        placement={isTablet ? "stacked" : "automatic"}
        placeholder="Search"
        onChangeText={() => {}}
      />
      <ThemedView>
        <Text>Search</Text>
      </ThemedView>
    </>
  );
}
