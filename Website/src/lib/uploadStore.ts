import { createStore, set, del, entries } from "idb-keyval";

import type { UploadPayload } from "@hobbyist/hooks";

// A create round persisted to IndexedDB so it survives tab close/crash; File bytes ride along via structured clone.
export type PersistedUpload = {
  id: string;
  createdAt: number;
  // Set once init succeeds; presence lets resume continue the existing post instead of recreating it.
  slug?: string;
  payload: UploadPayload<File>;
};

// Dedicated store so pending uploads never collide with other app state.
const store = createStore("hobbyist-uploads", "pending");

export const saveUpload = (record: PersistedUpload): Promise<void> =>
  set(record.id, record, store);

export const deleteUpload = (id: string): Promise<void> => del(id, store);

// Oldest first, so a resume sweep replays them in the order they were queued.
export const listUploads = async (): Promise<PersistedUpload[]> => {
  const records = (await entries<string, PersistedUpload>(store)).map(([, value]) => value);
  return records.sort((a, b) => a.createdAt - b.createdAt);
};
