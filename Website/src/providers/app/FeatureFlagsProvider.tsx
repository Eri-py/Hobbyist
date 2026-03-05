import type { ReactNode } from "react";

import { FeatureFlagsContext, useFeatureFlagsProvider } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { Loader } from "@/components/app/Loader";

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { value, isPending } = useFeatureFlagsProvider(axiosInstance);

  if (isPending) {
    return <Loader />;
  }

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}
