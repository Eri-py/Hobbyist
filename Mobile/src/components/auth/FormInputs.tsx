import { Controller, useFormContext, get } from "react-hook-form";
import { TextInput, useTheme, Text } from "react-native-paper";
import { useState, type ReactNode } from "react";
import { View } from "react-native";

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
  | "new-password"
  | "given-name"
  | "family-name"
  | "off";

type FormInputProps = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: AutoCompleteType;
  autoFocus?: boolean;
  startIcon?: string | ReactNode;
};

export function FormInput({
  name,
  label,
  type = "text",
  autoComplete,
  autoFocus,
  startIcon,
}: FormInputProps) {
  const { control } = useFormContext();
  const theme = useTheme();

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
      render={({ field: { onChange, onBlur, value }, formState: { errors } }) => (
        <View>
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
            autoFocus={autoFocus ?? false}
            style={{ backgroundColor: theme.colors.surface }}
          />
          {get(errors, name)?.message && (
            <Text style={{ fontSize: 12, color: theme.colors.error, paddingLeft: 4 }}>
              {get(errors, name)?.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}
