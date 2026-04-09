import { createRef, useCallback, useEffect, useMemo, useRef } from "react";

type ValidateChar = (character: string, index: number) => boolean;

type UseOtpInputParams = {
  value?: string;
  length?: number;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  validateChar?: ValidateChar;
  onBlur?: (value: string, isCompleted: boolean) => void;
};

type InputFocusEvent = React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>;
type InputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

const KEYBOARD_KEY = {
  left: "ArrowLeft",
  right: "ArrowRight",
  backspace: "Backspace",
  home: "Home",
  end: "End",
} as const;

const defaultValidateChar: ValidateChar = () => true;

export function useOtpInput({
  value = "",
  length = 4,
  onChange,
  onComplete,
  validateChar = defaultValidateChar,
  onBlur,
}: UseOtpInputParams) {
  const initialValue = useRef(value);

  const inputRefs = useMemo(
    () => Array.from({ length }, () => createRef<HTMLInputElement>()),
    [length],
  );

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
      inputRefs[index]?.current?.focus();
    },
    [inputRefs],
  );

  const selectInputByIndex = useCallback(
    (index: number) => {
      inputRefs[index]?.current?.select();
    },
    [inputRefs],
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
    (index: number, event: InputChangeEvent) => {
      const inputValue = event.target.value;

      if (index === 0 && inputValue.length > 1) {
        const { finalValue, isCompleted } = getCompletionState(inputValue);
        onChange?.(finalValue);

        if (isCompleted) {
          onComplete?.(finalValue);
        }

        selectInputByIndex(finalValue.length - 1);
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
    (index: number, event: React.KeyboardEvent<HTMLDivElement>) => {
      const inputElement = event.target as HTMLInputElement;
      const startPos = inputElement.selectionStart;
      const endPos = inputElement.selectionEnd;
      const isCaretBeforeChar = startPos === 0 && endPos === 0;

      if (inputElement.value === event.key) {
        event.preventDefault();
        moveToNextInput(index);
      } else if (event.key === KEYBOARD_KEY.backspace) {
        if (!inputElement.value) {
          event.preventDefault();
          selectInputByIndex(index - 1);
        } else if (isCaretBeforeChar) {
          event.preventDefault();

          const nextValue = replaceValueAtIndex(index, "");
          onChange?.(nextValue);

          if (nextValue.length <= index) {
            selectInputByIndex(index - 1);
          }
        }
      } else if (event.key === KEYBOARD_KEY.left) {
        event.preventDefault();
        selectInputByIndex(index - 1);
      } else if (event.key === KEYBOARD_KEY.right) {
        event.preventDefault();
        selectInputByIndex(index + 1);
      } else if (event.key === KEYBOARD_KEY.home) {
        event.preventDefault();
        selectInputByIndex(0);
      } else if (event.key === KEYBOARD_KEY.end) {
        event.preventDefault();
        selectInputByIndex(length - 1);
      }
    },
    [length, moveToNextInput, onChange, replaceValueAtIndex, selectInputByIndex],
  );

  const handleInputPaste = useCallback(
    (index: number, event: React.ClipboardEvent<HTMLDivElement>) => {
      const content = event.clipboardData.getData("text/plain");
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
        selectInputByIndex(nextValue.length);
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

  const handleInputFocus = useCallback((event: InputFocusEvent) => {
    event.preventDefault();
    event.target.select();
  }, []);

  const handleInputBlur = useCallback(
    (event: InputFocusEvent) => {
      const anInputIsFocused = inputRefs.some(({ current }) => {
        return current === event.relatedTarget;
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
