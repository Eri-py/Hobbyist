import { Controller, useFormContext } from "react-hook-form";
import { TextInput } from "react-native-paper";

type FormInputProps = {
  name: string;
  label: string;
  secureTextEntry?: boolean;
  autoComplete?: string;
  icon?: string;
};

export function FormInput({ name, label, secureTextEntry, autoComplete, icon }: FormInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          label={label}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          left={icon && <TextInput.Icon icon={icon} />}
          error={!!errors[name]}
          mode="outlined"
        />
      )}
    />
  );
}
