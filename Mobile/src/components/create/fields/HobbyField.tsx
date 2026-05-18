import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useFormContext } from "react-hook-form";
import { Text, useTheme } from "react-native-paper";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";

import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { fieldStyles } from "./fieldStyles";

export function HobbyField() {
  const theme = useTheme();
  const router = useRouter();
  const {
    watch,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();
  const selectedHobby = watch("hobby") || null;

  return (
    <TouchableOpacity
      style={fieldStyles.fieldRow}
      onPress={() => router.push("/(create)/hobby")}
      activeOpacity={0.6}
    >
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            { color: selectedHobby ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
          ]}
        >
          {selectedHobby ?? "Add a hobby *"}
        </Text>
        {selectedHobby ? (
          <SymbolView name="checkmark" size={14} tintColor={theme.colors.primary} />
        ) : (
          <SymbolView name="chevron.right" size={12} tintColor={theme.colors.onSurfaceVariant} />
        )}
      </View>
      {errors.hobby && (
        <Text style={[fieldStyles.error, { color: theme.colors.error }]}>
          {errors.hobby.message}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  value: {
    flex: 1,
    fontSize: 15,
  },
});
