import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Text, ActivityIndicator, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useFormContext } from "react-hook-form";

import { ThemedKeyboardView } from "@/components/shared/views/ThemedKeyboardView";
import { useCreateContext } from "@/hooks/create/useCreate";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";

export default function HobbyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { hobbies, isLoadingHobbies } = useCreateContext();
  const { setValue, watch } = useFormContext<CreateFormSchemaTypes>();
  const selectedHobby = watch("hobby") || null;
  const [customInput, setCustomInput] = useState("");

  const handleSelect = (hobby: string) => {
    setValue("hobby", hobby, { shouldValidate: true });
    router.back();
  };

  const handleCustomSubmit = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    handleSelect(trimmed);
  };

  return (
    <ThemedKeyboardView safeArea contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
          <SymbolView name="tag" size={28} tintColor={theme.colors.primary} />
        </View>
        <Text style={[styles.heading, { color: theme.colors.onSurface }]}>
          What&apos;s your hobby?
        </Text>
        <Text style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
          Pick one from the list or add your own. This helps collectors find your post.
        </Text>
      </View>

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

          <View
            style={[
              styles.inputWrap,
              {
                borderColor: theme.colors.outlineVariant,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <TextInput
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={handleCustomSubmit}
              placeholder="Not listed? Type your own..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              style={[styles.input, { color: theme.colors.onSurface }]}
              returnKeyType="done"
              maxLength={50}
            />
            {customInput.trim().length > 0 && (
              <TouchableOpacity
                onPress={handleCustomSubmit}
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={[styles.submitLabel, { color: theme.colors.onPrimary }]}>Done</Text>
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
    gap: 24,
  },
  hero: {
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
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
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  submitButton: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 100,
  },
  submitLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
