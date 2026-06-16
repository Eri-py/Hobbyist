import { useEffect, useRef } from "react";

import { useAuth, type UploadEngine } from "@hobbyist/hooks";
import { useBackgroundTasks } from "@/hooks/app/useBackgroundTasks";
import { listUploads, saveUpload, deleteUpload } from "@/lib/uploadStore";

// Older snapshots are dropped, not resumed — the server GC has likely reclaimed the session by then.
const RESUME_TTL_MS = 60 * 60 * 1000;

type ResumeConfig<TPayload> = {
  /** Builds the engine that replays a record: recreate when slug-less, resume when it has one. */
  buildEngine: () => UploadEngine<TPayload>;
  /** Notification label for a record being replayed. */
  label: (payload: TPayload) => string;
};

/**
 * On load, continues persisted-but-unfinished uploads: resume if a slug was saved, else recreate.
 * Runs once while authed. Generic over the payload — the caller supplies the engine + labels.
 */
export function useResumeUploads<TPayload>({ buildEngine, label }: ResumeConfig<TPayload>) {
  const { isAuthenticated } = useAuth();
  const { run } = useBackgroundTasks();
  const sweptRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || sweptRef.current) return;
    sweptRef.current = true;

    const { submit, resume } = buildEngine();

    void (async () => {
      const records = await listUploads<TPayload>().catch(() => []);
      for (const record of records) {
        if (Date.now() - record.createdAt > RESUME_TTL_MS) {
          await deleteUpload(record.id).catch(() => {});
          continue;
        }

        void run(async () => {
          const onSlug = (slug: string) => saveUpload({ ...record, slug }).catch(() => {});
          if (record.slug) await resume(record.slug, record.payload, onSlug);
          else await submit(record.payload, onSlug);
          await deleteUpload(record.id).catch(() => {});
        }, { label: label(record.payload) });
      }
    })();
  }, [isAuthenticated, run, buildEngine, label]);
}
