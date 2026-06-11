import type { ReactNode } from "react";

import { BackgroundTasksProvider } from "./BackgroundTasksProvider";
import { MobileHeaderProvider } from "./MobileHeaderProvider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <BackgroundTasksProvider>
      <MobileHeaderProvider>{children}</MobileHeaderProvider>
    </BackgroundTasksProvider>
  );
}
