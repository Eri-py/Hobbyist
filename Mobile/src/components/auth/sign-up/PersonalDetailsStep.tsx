import { StyleSheet, View } from "react-native";
import { Controller, useFormContext, get } from "react-hook-form";
import { HelperText } from "react-native-paper";

import { FormInput } from "../FormInputs";
import { ThemedButton } from "@/components/shared/ThemedButton";

type PersonalDetailsStepProps = {
  onSubmit: () => void;
  isPending: boolean;
};

export function PersonalDetailsStep({ onSubmit, isPending }: PersonalDetailsStepProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <View style={styles.container}>
      <FormInput name="firstname" label="Firstname" startIcon="account" autoComplete="given-name" />

      <FormInput name="lastname" label="Lastname" startIcon="account" autoComplete="family-name" />

      <View>
        <View style={styles.dateInputRow}>
          <Controller
            control={control}
            name="dateOfBirth.year"
            render={({ field: { onChange, value } }) => (
              <View style={styles.dateInputContainer}>
                <FormInput name="dateOfBirth.year" label="Year" autoComplete="birthdate-year" />
              </View>
            )}
          />
          <Controller
            control={control}
            name="dateOfBirth.month"
            render={({ field: { onChange, value } }) => (
              <View style={styles.dateInputContainer}>
                <FormInput name="dateOfBirth.month" label="Month" autoComplete="birthdate-month" />
              </View>
            )}
          />
          <Controller
            control={control}
            name="dateOfBirth.day"
            render={({ field: { onChange, value } }) => (
              <View style={styles.dateInputContainer}>
                <FormInput name="dateOfBirth.day" label="Day" autoComplete="birthdate-day" />
              </View>
            )}
          />
        </View>
        {get(errors, "dateOfBirth")?.message && (
          <HelperText type="error" visible={!!errors.dateOfBirth}>
            {get(errors, "dateOfBirth")?.message as string}
          </HelperText>
        )}
      </View>

      <ThemedButton mode="contained" onPress={onSubmit} loading={isPending}>
        Submit
      </ThemedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  dateInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateInputContainer: {
    flex: 1,
  },
});
