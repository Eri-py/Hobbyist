import { StyleSheet, View } from "react-native";
import { Chip, Text, TextInput, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedButton } from "@/components/shared/ThemedButton";
import { useInterestsStep } from "@hobbyist/hooks";

type InterestsStepProps = {
  popularInterests: string[];
  onSubmit: () => void;
  isPending: boolean;
};

export function InterestsStep({ popularInterests, onSubmit, isPending }: InterestsStepProps) {
  const theme = useTheme();
  const {
    interests,
    customInput,
    updateCustomInput,
    customInterests,
    interestsError,
    toggleCategory,
    addCustom,
    removeCustom,
  } = useInterestsStep(popularInterests);

  return (
    <View style={styles.container}>
      {popularInterests.length > 0 && (
        <View style={styles.chipGroup}>
          {popularInterests.map((interest) => {
            const selected = interests.includes(interest);

            return (
              <Chip
                key={interest}
                selected={selected}
                showSelectedCheck
                mode={selected ? "flat" : "outlined"}
                onPress={() => toggleCategory(interest)}
                style={[styles.chip, selected && { backgroundColor: theme.colors.primary }]}
              >
                {interest}
              </Chip>
            );
          })}
        </View>
      )}

      <View style={styles.customRow}>
        <TextInput
          label="Add a custom interest"
          value={customInput}
          onChangeText={updateCustomInput}
          onSubmitEditing={addCustom}
          returnKeyType="done"
          maxLength={50}
          mode="outlined"
          style={[styles.customInput, { backgroundColor: theme.colors.surface }]}
          autoFocus
        />
        <ThemedButton mode="outlined" onPress={addCustom}>
          <MaterialCommunityIcons name="plus" color={theme.colors.onSurface} size={24} />
        </ThemedButton>
      </View>

      {customInterests.length > 0 && (
        <View style={styles.chipGroup}>
          {customInterests.map((interest) => (
            <Chip
              key={interest}
              mode="outlined"
              onClose={() => removeCustom(interest)}
              style={styles.chip}
            >
              {interest}
            </Chip>
          ))}
        </View>
      )}

      {!!interestsError && (
        <Text style={{ fontSize: 12, color: theme.colors.error }}>{interestsError}</Text>
      )}

      <ThemedButton mode="contained" onPress={onSubmit} loading={isPending}>
        Complete Sign Up
      </ThemedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 8,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customInput: {
    flex: 1,
  },
});
