import { StyleSheet, View } from "react-native";
import { Controller, useFormContext, get } from "react-hook-form";

import { FormInput } from "../FormInputs";
import { ThemedButton } from "@/components/shared/ThemedButton";
import { DatePicker } from "@/components/shared/DatePicker";

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

      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field: { onChange, value } }) => (
          <DatePicker
            value={value}
            onChange={onChange}
            error={get(errors, "dateOfBirth")?.message as string}
          />
        )}
      />

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
});
