import { TextInput, View, StyleSheet } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text, useTheme } from "react-native-paper";

import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { fieldStyles } from "./fieldStyles";

export function DescriptionField() {
  const theme = useTheme();
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();

  return (
    <View style={fieldStyles.fieldRow}>
      <View style={fieldStyles.labelRow}>
        <Text style={[fieldStyles.label, { color: theme.colors.onSurfaceVariant }]}>
          Description <Text style={{ color: theme.colors.error }}>*</Text>
        </Text>
        {errors.description && (
          <Text style={[fieldStyles.error, { color: theme.colors.error }]}>
            {errors.description.message}
          </Text>
        )}
      </View>
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Mention condition, details, and what makes this special..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={[styles.input, { color: theme.colors.onSurface }]}
            multiline
            textAlignVertical="top"
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 15,
    padding: 0,
    minHeight: 80,
    lineHeight: 22,
  },
});
