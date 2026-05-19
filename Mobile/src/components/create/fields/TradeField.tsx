import { TextInput, View, Switch, StyleSheet } from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { Text, useTheme } from "react-native-paper";

import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { fieldStyles } from "./fieldStyles";

export function TradeField() {
  const theme = useTheme();
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreateFormSchemaTypes>();
  const availableForTrade = watch("availableForTrade");

  return (
    <View style={fieldStyles.fieldRow}>
      <View style={fieldStyles.labelRow}>
        <Text style={[styles.tradeLabel, { color: theme.colors.onSurfaceVariant }]}>
          Available for trade
        </Text>
        <Controller
          control={control}
          name="availableForTrade"
          render={({ field: { value, onChange } }) => (
            <Switch
              value={value ?? false}
              onValueChange={(checked) => {
                onChange(checked);
                if (!checked) setValue("lookingFor", "");
              }}
              trackColor={{ true: theme.colors.primary }}
            />
          )}
        />
      </View>
      {availableForTrade && (
        <>
          <Controller
            control={control}
            name="lookingFor"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="e.g. Vintage Leica lenses, rare Catan expansions..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                style={[
                  styles.input,
                  { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant },
                ]}
                multiline
                textAlignVertical="top"
                maxLength={500}
                autoFocus
              />
            )}
          />
          {errors.lookingFor && (
            <Text style={[fieldStyles.error, { color: theme.colors.error }]}>
              {errors.lookingFor.message}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tradeLabel: {
    fontSize: 15,
  },
  input: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    lineHeight: 22,
  },
});
