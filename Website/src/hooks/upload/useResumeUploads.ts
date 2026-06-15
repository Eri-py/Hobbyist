import { useEffect, useRef } from "react";

import { createUploadEngine, createPostUploadResource, useAuth } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import { uploadToStorage } from "@/api/uploadToStorage";
import { useBackgroundTasks } from "@/hooks/app/useBackgroundTasks";
import { listUploads, saveUpload, deleteUpload } from "@/lib/uploadStore";

// Older snapshots are dropped, not resumed — the server GC has likely reclaimed the post by then.
const RESUME_TTL_MS = 60 * 60 * 1000;

/** On load, continues persisted-but-unfinished uploads: resume if we have a slug, else recreate. Once, while authed. */
export function useResumeUploads() {
  const { isAuthenticated } = useAuth();
  const { run } = useBackgroundTasks();
  const sweptRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || sweptRef.current) return;
    sweptRef.current = true;

    const { submit, resume } = createUploadEngine(
      createPostUploadResource<File>(axiosInstance),
      uploadToStorage,
    );

    void (async () => {
      const records = await listUploads().catch(() => []);
      for (const record of records) {
        if (Date.now() - record.createdAt > RESUME_TTL_MS) {
          await deleteUpload(record.id).catch(() => {});
          continue;
        }

        const label = record.payload.publish ? "Resuming your post" : "Resuming your draft";
        void run(async () => {
          const onSlug = (slug: string) => saveUpload({ ...record, slug }).catch(() => {});
          if (record.slug) await resume(record.slug, record.payload, onSlug);
          else await submit(record.payload, onSlug);
          await deleteUpload(record.id).catch(() => {});
        }, { label });
      }
    })();
  }, [isAuthenticated, run]);
}
