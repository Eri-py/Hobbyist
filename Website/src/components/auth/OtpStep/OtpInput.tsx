import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";

import { useOtpInput } from "@/hooks/auth/useOtpInput";

type OtpTextFieldProps = Omit<
  TextFieldProps,
  "onChange" | "select" | "multiline" | "defaultValue" | "value" | "autoFocus"
>;

type OtpBoxProps = Omit<BoxProps, "onChange" | "onBlur">;

type OtpInputProps = OtpBoxProps & {
  value?: string;
  length?: number;
  autoFocus?: boolean;
  textFieldsProps?: OtpTextFieldProps | ((index: number) => OtpTextFieldProps);
  onComplete?: (value: string) => void;
  validateChar?: (character: string, index: number) => boolean;
  onChange?: (value: string) => void;
  onBlur?: (value: string, isCompleted: boolean) => void;
};

export function OtpInput({
  value = "",
  length = 4,
  autoFocus = false,
  textFieldsProps,
  onChange,
  onComplete,
  validateChar,
  onBlur,
  ...boxProps
}: OtpInputProps) {
  const {
    characters,
    inputRefs,
    handleInputChange,
    handleInputKeyDown,
    handleInputPaste,
    handleInputFocus,
    handleInputBlur,
  } = useOtpInput({
    value,
    length,
    onChange,
    onComplete,
    validateChar,
    onBlur,
  });

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
            autoFocus={autoFocus ? index === 0 : false}
            autoComplete="one-time-code"
            value={character}
            inputRef={inputRefs[index]}
            onPaste={(event) => {
              event.preventDefault();
              handleInputPaste(index, event);
              onPaste?.(event);
            }}
            onFocus={(event) => {
              handleInputFocus(event);
              onFocus?.(event);
            }}
            onChange={(event) => {
              handleInputChange(index, event);
            }}
            onKeyDown={(event) => {
              handleInputKeyDown(index, event);
              onKeyDown?.(event);
            }}
            onBlur={(event) => {
              onTextFieldBlur?.(event);
              handleInputBlur(event);
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
