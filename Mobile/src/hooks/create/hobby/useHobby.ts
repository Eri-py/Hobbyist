import { useState, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFormContext } from "react-hook-form";

import { useCreateContext } from "@/hooks/create/useCreate";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";

export function useHobby() {
  const router = useRouter();
  const { hobbies, isLoadingHobbies } = useCreateContext();
  const { setValue, watch } = useFormContext<CreateFormSchemaTypes>();
  const selectedHobby = watch("hobby") || null;
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim();

  const filteredHobbies = useMemo(() => {
    if (!trimmedQuery) return hobbies;
    return hobbies.filter((h) => h.name.toLowerCase().includes(trimmedQuery.toLowerCase()));
  }, [hobbies, trimmedQuery]);

  const showAddRow =
    trimmedQuery.length > 0 &&
    !hobbies.some((h) => h.name.toLowerCase() === trimmedQuery.toLowerCase());

  const handleSelect = useCallback(
    (name: string) => {
      setValue("hobby", name, { shouldValidate: true });
      router.back();
    },
    [setValue, router],
  );

  return {
    query,
    setQuery,
    trimmedQuery,
    filteredHobbies,
    showAddRow,
    selectedHobby,
    isLoadingHobbies,
    handleSelect,
  };
}
