import type { ReactNode } from "react";

import { MobileHeaderProvider } from "./MobileHeaderProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return <MobileHeaderProvider>{children}</MobileHeaderProvider>;
}
