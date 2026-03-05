import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import type { components } from "@hobbyist/types";

type FeatureFlagsResponse = components["schemas"]["FeatureFlagsResponse"];
type FeatureFlags = FeatureFlagsResponse["flags"];

export const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider.");
  }
  return context;
}

export const FEATURE_FLAGS_QUERY_KEY = ["featureFlags"] as const;

export function useFeatureFlagsProvider(axiosInstance: AxiosInstance) {
  const { data, isPending } = useQuery({
    queryKey: FEATURE_FLAGS_QUERY_KEY,
    queryFn: () =>
      axiosInstance.get<FeatureFlagsResponse>("feature-flags").then((res) => res.data.flags),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return { value: data ?? {}, isPending };
}
