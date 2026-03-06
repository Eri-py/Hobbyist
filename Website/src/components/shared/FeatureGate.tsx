import { useNavigate } from "@tanstack/react-router";
import { useFeatureFlags } from "@hobbyist/hooks";
import { useEffect, type ReactNode } from "react";
import type { FeatureFlag } from "@hobbyist/types";

export function FeatureGate({ flag, children }: { flag: FeatureFlag; children: ReactNode }) {
  const flags = useFeatureFlags();
  const navigate = useNavigate();
  const isEnabled = flags[flag];

  useEffect(() => {
    if (!isEnabled) {
      void navigate({ to: "/" });
    }
  }, [isEnabled, navigate]);

  if (!isEnabled) return null;
  return <>{children}</>;
}
