import { Controller, useFormContext } from "react-hook-form";
import { TextInput } from "react-native-paper";
import { useState, type ReactNode } from "react";

type AutoCompleteType =
  | "email"
  | "password"
  | "username"
  | "name"
  | "additional-name"
  | "address-line1"
  | "address-line2"
  | "birthdate-day"
  | "birthdate-full"
  | "birthdate-month"
  | "birthdate-year"
  | "off";

type FormInputProps = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: AutoCompleteType;
  startIcon?: string | ReactNode;
};

export function FormInput({ name, label, type = "text", autoComplete, startIcon }: FormInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const isPasswordField = type === "password";
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const passwordRightIcon = () => (
    <TextInput.Icon
      icon={isPasswordVisible ? "eye-off" : "eye"}
      onPress={() => setPasswordVisible(!isPasswordVisible)}
      forceTextInputFocus={false}
    />
  );

  const renderLeftIcon = () => {
    if (!startIcon) return undefined;

    if (typeof startIcon === "string") {
      return <TextInput.Icon icon={startIcon} />;
    }

    return <TextInput.Icon icon={() => startIcon as ReactNode} />;
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          label={label}
          value={value || ""}
          onChangeText={onChange}
          onBlur={onBlur}
          secureTextEntry={isPasswordField ? !isPasswordVisible : false}
          autoComplete={autoComplete}
          left={renderLeftIcon()}
          right={isPasswordField ? passwordRightIcon() : undefined}
          error={!!errors[name]}
          mode="outlined"
          style={{ backgroundColor: "white" }}
        />
      )}
    />
  );
}
