import { createRef, useCallback, useEffect, useMemo, useRef } from "react";

type ValidateChar = (character: string, index: number) => boolean;

type OtpFocusableInput = {
  focus: () => void;
  select?: () => void;
};

type UseOtpInputParams = {
  value?: string;
  length?: number;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  validateChar?: ValidateChar;
  onBlur?: (value: string, isCompleted: boolean) => void;
};

type OtpInputKeyDownParams = {
  key: string;
  currentValue: string;
  selectionStart?: number | null;
  selectionEnd?: number | null;
};

const KEYBOARD_KEY = {
  left: "ArrowLeft",
  right: "ArrowRight",
  backspace: "Backspace",
  home: "Home",
  end: "End",
} as const;

const defaultValidateChar: ValidateChar = () => true;

export function useOtpInput<TInput extends OtpFocusableInput = OtpFocusableInput>({
  value = "",
  length = 4,
  onChange,
  onComplete,
  validateChar = defaultValidateChar,
  onBlur,
}: UseOtpInputParams) {
  const initialValue = useRef(value);

  const inputRefs = useMemo(() => Array.from({ length }, () => createRef<TInput>()), [length]);

  const characters = useMemo(
    () => Array.from({ length }, (_, index) => value[index] || ""),
    [length, value],
  );

  const getCompletionState = useCallback(
    (rawValue: string) => {
      const finalValue = rawValue.slice(0, length);

      return {
        finalValue,
        isCompleted: finalValue.length === length,
      };
    },
    [length],
  );

  useEffect(() => {
    const { isCompleted, finalValue } = getCompletionState(initialValue.current);

    if (isCompleted) {
      onComplete?.(finalValue);
    }
  }, [getCompletionState, onComplete]);

  const isValidCharacter = useCallback(
    (character: string, index: number) => {
      return validateChar(character, index);
    },
    [validateChar],
  );

  const replaceValueAtIndex = useCallback(
    (index: number, character: string) => {
      const nextCharacters = characters.map((currentChar, currentIndex) => {
        return currentIndex === index ? character : currentChar;
      });

      return nextCharacters.join("");
    },
    [characters],
  );

  const focusInputByIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= length) {
        return;
      }

      inputRefs[index]?.current?.focus();
    },
    [inputRefs, length],
  );

  const selectInputByIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= length) {
        return;
      }

      const target = inputRefs[index]?.current;

      if (!target) {
        return;
      }

      if (typeof target.select === "function") {
        target.select();
        return;
      }

      target.focus();
    },
    [inputRefs, length],
  );

  const moveToNextInput = useCallback(
    (currentIndex: number) => {
      if (currentIndex + 1 >= length) {
        return;
      }

      if (characters[currentIndex + 1]) {
        selectInputByIndex(currentIndex + 1);
      } else {
        focusInputByIndex(currentIndex + 1);
      }
    },
    [characters, focusInputByIndex, length, selectInputByIndex],
  );

  const handleInputChange = useCallback(
    (index: number, inputValue: string) => {
      if (index === 0 && inputValue.length > 1) {
        const { finalValue, isCompleted } = getCompletionState(inputValue);
        onChange?.(finalValue);

        if (isCompleted) {
          onComplete?.(finalValue);
        }

        if (finalValue.length > 0) {
          selectInputByIndex(finalValue.length - 1);
        }

        return;
      }

      const firstCharacter = inputValue[0] || "";
      let character = firstCharacter;

      if (character && !isValidCharacter(character, index)) {
        character = "";
      }

      const nextValue = replaceValueAtIndex(index, character);
      onChange?.(nextValue);

      const { finalValue, isCompleted } = getCompletionState(nextValue);

      if (isCompleted) {
        onComplete?.(finalValue);
      }

      if (character !== "") {
        if (nextValue.length - 1 < index) {
          selectInputByIndex(nextValue.length);
        } else {
          moveToNextInput(index);
        }
      } else if (firstCharacter === "" && nextValue.length <= index) {
        selectInputByIndex(index - 1);
      }
    },
    [
      getCompletionState,
      isValidCharacter,
      moveToNextInput,
      onChange,
      onComplete,
      replaceValueAtIndex,
      selectInputByIndex,
    ],
  );

  const handleInputKeyDown = useCallback(
    (index: number, params: OtpInputKeyDownParams) => {
      const { key, currentValue, selectionStart = null, selectionEnd = null } = params;
      const isCaretBeforeChar = selectionStart === 0 && selectionEnd === 0;

      if (currentValue === key) {
        moveToNextInput(index);
      } else if (key === KEYBOARD_KEY.backspace) {
        if (!currentValue) {
          selectInputByIndex(index - 1);
        } else if (isCaretBeforeChar) {
          const nextValue = replaceValueAtIndex(index, "");
          onChange?.(nextValue);

          if (nextValue.length <= index) {
            selectInputByIndex(index - 1);
          }
        }
      } else if (key === KEYBOARD_KEY.left) {
        selectInputByIndex(index - 1);
      } else if (key === KEYBOARD_KEY.right) {
        selectInputByIndex(index + 1);
      } else if (key === KEYBOARD_KEY.home) {
        selectInputByIndex(0);
      } else if (key === KEYBOARD_KEY.end) {
        selectInputByIndex(length - 1);
      }
    },
    [length, moveToNextInput, onChange, replaceValueAtIndex, selectInputByIndex],
  );

  const handleInputPaste = useCallback(
    (index: number, content: string) => {
      const contentCharacters = content.split("");
      const firstEmptyIndex = characters.findIndex((character) => character === "");
      const startIndex = firstEmptyIndex === -1 ? index : Math.min(firstEmptyIndex, index);

      const mergedCharacters = characters.map((existingCharacter, characterIndex) => {
        if (characterIndex < startIndex) {
          return existingCharacter;
        }

        const nextCharacter = contentCharacters[characterIndex - startIndex] || "";
        return isValidCharacter(nextCharacter, characterIndex) ? nextCharacter : "";
      });

      const nextValue = mergedCharacters.join("");
      onChange?.(nextValue);

      const { finalValue, isCompleted } = getCompletionState(nextValue);

      if (isCompleted) {
        onComplete?.(finalValue);
        selectInputByIndex(length - 1);
      } else {
        selectInputByIndex(Math.max(0, nextValue.length));
      }
    },
    [
      characters,
      getCompletionState,
      isValidCharacter,
      length,
      onChange,
      onComplete,
      selectInputByIndex,
    ],
  );

  const handleInputFocus = useCallback(
    (index: number) => {
      selectInputByIndex(index);
    },
    [selectInputByIndex],
  );

  const handleInputBlur = useCallback(
    (relatedTarget: unknown) => {
      const anInputIsFocused = inputRefs.some(({ current }) => {
        return current === relatedTarget;
      });

      if (!anInputIsFocused) {
        const { finalValue, isCompleted } = getCompletionState(value);
        onBlur?.(finalValue, isCompleted);
      }
    },
    [getCompletionState, inputRefs, onBlur, value],
  );

  return {
    inputRefs,
    characters,
    handleInputChange,
    handleInputKeyDown,
    handleInputPaste,
    handleInputFocus,
    handleInputBlur,
  };
}
