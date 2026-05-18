import { createContext, useContext } from "react";

import type { useCreate } from "@/hooks/create/useCreate";

type CreateContextValue = ReturnType<typeof useCreate>;

export const CreateContext = createContext<CreateContextValue | null>(null);

export function useCreateContext() {
  const ctx = useContext(CreateContext);
  if (!ctx) throw new Error("useCreateContext must be used within the create layout");
  return ctx;
}
