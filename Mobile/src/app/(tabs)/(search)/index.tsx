import { Text } from "react-native-paper";
import { Stack } from "expo-router";

import { ThemedView } from "@/components/shared/ThemedView";

export default function SearchIndex() {
  return (
    <>
      <Stack.SearchBar placement="automatic" placeholder="Search" onChangeText={() => {}} />
      <ThemedView>
        <Text>Search</Text>
      </ThemedView>
    </>
  );
}
