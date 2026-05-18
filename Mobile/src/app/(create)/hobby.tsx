import { ActivityIndicator, StyleSheet } from "react-native";

import { ThemedKeyboardView } from "@/components/shared/views/ThemedKeyboardView";
import { HobbySearchBar } from "@/components/create/hobby/HobbySearchBar";
import { HobbyList } from "@/components/create/hobby/HobbyList";
import { useHobby } from "@/hooks/create/hobby/useHobby";

export default function HobbyScreen() {
  const {
    query,
    setQuery,
    trimmedQuery,
    filteredHobbies,
    showAddRow,
    selectedHobby,
    isLoadingHobbies,
    handleSelect,
  } = useHobby();

  return (
    <ThemedKeyboardView
      safeArea
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
    >
      <HobbySearchBar query={query} onChangeQuery={setQuery} />

      {isLoadingHobbies ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <HobbyList
          hobbies={filteredHobbies}
          selectedHobby={selectedHobby}
          trimmedQuery={trimmedQuery}
          showAddRow={showAddRow}
          onSelect={handleSelect}
        />
      )}
    </ThemedKeyboardView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  loader: {
    marginTop: 32,
  },
});
