import { useMemo } from "react";
import { View, TextInput, StyleSheet, type TextInputProps } from "react-native";
import { useTheme } from "react-native-paper";

import { useOtpInput } from "@hobbyist/hooks";

type OtpMode = "numeric" | "alphanumeric";

type OtpInputProps = {
  value?: string;
  length?: number;
  mode?: OtpMode;
  hasError?: boolean;
  onChange?: (value: string) => void;
};

const NUMERIC_CHARACTER_REGEX = /^[0-9]$/;
const ALPHANUMERIC_CHARACTER_REGEX = /^[a-zA-Z0-9]$/;

export function OtpInput({
  value = "",
  length = 6,
  mode = "numeric",
  hasError = false,
  onChange,
}: OtpInputProps) {
  const theme = useTheme();

  const validateChar = useMemo(() => {
    if (mode === "numeric") {
      return (character: string) => NUMERIC_CHARACTER_REGEX.test(character);
    }

    return (character: string) => ALPHANUMERIC_CHARACTER_REGEX.test(character);
  }, [mode]);

  const keyboardType: TextInputProps["keyboardType"] =
    mode === "numeric" ? "number-pad" : "default";

  const { inputRefs, characters, handleInputChange, handleInputKeyDown, handleInputFocus } =
    useOtpInput<TextInput>({
      value,
      length,
      onChange,
      validateChar,
    });

  return (
    <View style={styles.container}>
      {characters.map((character, index) => (
        <TextInput
          key={index}
          ref={inputRefs[index]}
          value={character}
          onFocus={() => handleInputFocus(index)}
          onChangeText={(text) => {
            handleInputChange(index, text);
          }}
          onKeyPress={(event) => {
            handleInputKeyDown(index, {
              key: event.nativeEvent.key,
              currentValue: character,
            });
          }}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          autoCorrect={false}
          autoCapitalize={mode === "alphanumeric" ? "characters" : "none"}
          keyboardType={keyboardType}
          maxLength={index === 0 ? length : 1}
          style={[
            styles.otpBox,
            {
              borderColor: hasError ? theme.colors.error : theme.colors.outline,
              color: theme.colors.onSurface,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  otpBox: {
    borderWidth: 1,
    borderRadius: 10,
    width: 44,
    height: 52,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
});
