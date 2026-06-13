import { createStore, set, del, entries } from "idb-keyval";

import type { UploadPayload } from "@hobbyist/hooks";

// A create round persisted to IndexedDB so it survives a tab close / crash and can be re-run.
// `File` blobs ride along via structured clone — IndexedDB stores the bytes, not a reference.
export type PersistedUpload = {
  id: string;
  createdAt: number;
  // Set once init succeeds; its presence means resume can continue the existing post rather than
  // recreating it.
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
