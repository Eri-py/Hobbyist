import { useCallback } from "react";

import {
  createUploadEngine,
  createPostUploadResource,
  type CreatePostPayload,
} from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { uploadToStorage } from "@/api/uploadToStorage";
import { useResumeUploads } from "@/hooks/upload/useResumeUploads";

/** Post-specific resume wiring: feeds the post engine + labels into the generic resume sweep. */
export function useResumePostUploads() {
  const buildEngine = useCallback(
    () => createUploadEngine(createPostUploadResource<File>(axiosInstance), uploadToStorage),
    [],
  );

  const label = useCallback(
    (payload: CreatePostPayload<File>) =>
      payload.publish ? "Resuming your post" : "Resuming your draft",
    [],
  );

  useResumeUploads<CreatePostPayload<File>>({ buildEngine, label });
}
