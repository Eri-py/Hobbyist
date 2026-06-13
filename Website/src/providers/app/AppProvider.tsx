import type { ReactNode } from "react";

import { useResumeUploads } from "@/hooks/create/useResumeUploads";
import { BackgroundTasksProvider } from "./BackgroundTasksProvider";
import { MobileHeaderProvider } from "./MobileHeaderProvider";

// Kicks off the resume sweep once on load. It has to sit inside BackgroundTasksProvider (it needs
// run()), which AppProvider's own body is outside of — hence this tiny mount. Renders nothing.
function ResumeUploadsOnLoad() {
  useResumeUploads();
  return null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <BackgroundTasksProvider>
      <ResumeUploadsOnLoad />
      <MobileHeaderProvider>{children}</MobileHeaderProvider>
    </BackgroundTasksProvider>
  );
}
