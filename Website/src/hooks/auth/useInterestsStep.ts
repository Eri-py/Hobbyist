import { useState, type KeyboardEvent } from "react";
import { get, useFormContext, useWatch } from "react-hook-form";

export function useInterestsStep(popularInterests: string[]) {
  const {
    setValue,
    formState: { errors },
  } = useFormContext();

  const interests: string[] = useWatch({ name: "interests" }) ?? [];
  const [customInput, setCustomInput] = useState("");

  const updateCustomInput = (value: string) => {
    setCustomInput(value);
  };

  const toggleCategory = (name: string) => {
    const updated = interests.includes(name)
      ? interests.filter((i) => i !== name)
      : [...interests, name];
    setValue("interests", updated, { shouldValidate: true });
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setValue("interests", [...interests, trimmed], { shouldValidate: true });
    }
    setCustomInput("");
  };

  const removeCustom = (name: string) => {
    setValue(
      "interests",
      interests.filter((i) => i !== name),
      { shouldValidate: true },
    );
  };

  const onInputKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      addCustom();
    }
  };

  const customInterests = interests.filter((i) => !popularInterests.includes(i));
  const interestsError = get(errors, "interests.message") as string | undefined;

  return {
    interests,
    customInput,
    updateCustomInput,
    customInterests,
    interestsError,
    toggleCategory,
    addCustom,
    removeCustom,
    onInputKeyDown,
  };
}
