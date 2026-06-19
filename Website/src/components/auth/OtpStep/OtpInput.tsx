import { useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";

import { useOtpInput } from "@hobbyist/hooks";

type OtpMode = "numeric" | "alphanumeric";

type OtpTextFieldProps = Omit<
  TextFieldProps,
  "onChange" | "select" | "multiline" | "defaultValue" | "value" | "autoFocus"
>;

type OtpBoxProps = Omit<BoxProps, "onChange" | "onBlur">;

type OtpInputProps = OtpBoxProps & {
  value?: string;
  length?: number;
  mode?: OtpMode;
  autoFocus?: boolean;
  textFieldsProps?: OtpTextFieldProps | ((index: number) => OtpTextFieldProps);
  onComplete?: (value: string) => void;
  validateChar?: (character: string, index: number) => boolean;
  onChange?: (value: string) => void;
  onBlur?: (value: string, isCompleted: boolean) => void;
};

const NUMERIC_CHARACTER_REGEX = /^[0-9]$/;
const ALPHANUMERIC_CHARACTER_REGEX = /^[a-zA-Z0-9]$/;

export function OtpInput({
  value = "",
  length = 4,
  mode = "numeric",
  autoFocus = false,
  textFieldsProps,
  onChange,
  onComplete,
  validateChar,
  onBlur,
  ...boxProps
}: OtpInputProps) {
  // An explicit validateChar wins; otherwise restrict characters by mode.
  const resolvedValidateChar = useMemo(() => {
    if (validateChar) return validateChar;

    const regex = mode === "numeric" ? NUMERIC_CHARACTER_REGEX : ALPHANUMERIC_CHARACTER_REGEX;
    return (character: string) => regex.test(character);
  }, [validateChar, mode]);

  const {
    characters,
    inputRefs,
    handleInputChange,
    handleInputKeyDown,
    handleInputPaste,
    handleInputFocus,
    handleInputBlur,
  } = useOtpInput<HTMLInputElement>({
    value,
    length,
    onChange,
    onComplete,
    validateChar: resolvedValidateChar,
    onBlur,
  });

  useEffect(() => {
    if (!autoFocus) return;
    const firstInput = inputRefs[0]?.current;
    firstInput?.focus();
    firstInput?.setSelectionRange(0, 0);
  }, [autoFocus, inputRefs]);

  return (
    <Box
      {...boxProps}
      sx={[
        {
          display: "flex",
          alignItems: "center",
          gap: 2.5,
        },
        ...(Array.isArray(boxProps.sx) ? boxProps.sx : [boxProps.sx]),
      ]}
    >
      {characters.map((character, index) => {
        const resolvedTextFieldsProps =
          typeof textFieldsProps === "function"
            ? (textFieldsProps(index) ?? {})
            : (textFieldsProps ?? {});

        const {
          onPaste,
          onFocus,
          onKeyDown,
          onBlur: onTextFieldBlur,
          sx,
          ...restTextFieldProps
        } = resolvedTextFieldsProps;

        return (
          <TextField
            key={index}
            autoComplete="one-time-code"
            slotProps={{
              htmlInput:
                mode === "numeric"
                  ? { inputMode: "numeric", pattern: "[0-9]*" }
                  : { inputMode: "text" },
            }}
            value={character}
            inputRef={inputRefs[index]}
            onPaste={(event) => {
              event.preventDefault();
              handleInputPaste(index, event.clipboardData.getData("text/plain"));
              onPaste?.(event);
            }}
            onFocus={(event) => {
              handleInputFocus(index);
              onFocus?.(event);
            }}
            onChange={(event) => {
              handleInputChange(index, event.target.value);
            }}
            onKeyDown={(event) => {
              const inputElement = event.target as HTMLInputElement;

              handleInputKeyDown(index, {
                key: event.key,
                currentValue: inputElement.value,
                selectionStart: inputElement.selectionStart,
                selectionEnd: inputElement.selectionEnd,
              });

              onKeyDown?.(event);
            }}
            onBlur={(event) => {
              onTextFieldBlur?.(event);
              handleInputBlur(event.relatedTarget);
            }}
            sx={
              Array.isArray(sx)
                ? [{ "& input": { textAlign: "center" } }, ...sx]
                : [{ "& input": { textAlign: "center" } }, sx]
            }
            {...restTextFieldProps}
          />
        );
      })}
    </Box>
  );
}
