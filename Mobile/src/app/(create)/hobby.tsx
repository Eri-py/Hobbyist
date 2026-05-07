import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";

import { ThemedKeyboardView } from "@/components/shared/views/ThemedKeyboardView";
import { useCreateContext } from "@/hooks/create/CreateContext";

export default function HobbyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { hobbies, isLoadingHobbies, selectedHobby, setSelectedHobby } = useCreateContext();
  const [customInput, setCustomInput] = useState("");

  const handleSelect = (hobby: string) => {
    setSelectedHobby(hobby);
    router.back();
  };

  const handleCustomSubmit = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    handleSelect(trimmed);
  };

  return (
    <ThemedKeyboardView safeArea contentContainerStyle={styles.content}>
      {isLoadingHobbies ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <>
          <View style={styles.chipsRow}>
            {hobbies.map((hobby) => {
              const selected = selectedHobby === hobby;
              return (
                <TouchableOpacity
                  key={hobby}
                  onPress={() => handleSelect(hobby)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? theme.colors.primary : "transparent",
                      borderColor: selected ? theme.colors.primary : theme.colors.outline,
                    },
                  ]}
                >
                  {selected && (
                    <SymbolView name="checkmark" size={12} tintColor={theme.colors.onPrimary} />
                  )}
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: selected ? theme.colors.onPrimary : theme.colors.onSurface },
                    ]}
                  >
                    {hobby}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.customInputRow, { borderColor: theme.colors.outlineVariant }]}>
            <TextInput
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={handleCustomSubmit}
              placeholder="Type a custom hobby..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              style={[styles.customInput, { color: theme.colors.onSurface }]}
              returnKeyType="done"
              maxLength={50}
            />
            {customInput.trim().length > 0 && (
              <TouchableOpacity onPress={handleCustomSubmit} style={styles.addButton}>
                <SymbolView
                  name="arrow.up.circle.fill"
                  size={28}
                  tintColor={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ThemedKeyboardView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  loader: {
    marginTop: 32,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 6,
  },
  customInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  addButton: {
    padding: 4,
  },
});
