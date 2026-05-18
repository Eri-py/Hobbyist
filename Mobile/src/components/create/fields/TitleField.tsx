import { TextInput, View, StyleSheet } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text, useTheme } from "react-native-paper";

import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { fieldStyles } from "./fieldStyles";

export function TitleField() {
  const theme = useTheme();
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();

  return (
    <View style={fieldStyles.fieldRow}>
      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Add a title *"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={[styles.input, { color: theme.colors.onSurface }]}
            returnKeyType="next"
          />
        )}
      />
      {errors.title && (
        <Text style={[fieldStyles.error, { color: theme.colors.error }]}>
          {errors.title.message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 17,
    fontWeight: "600",
    padding: 0,
  },
});
