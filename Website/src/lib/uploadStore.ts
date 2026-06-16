import { createStore, set, del, entries } from "idb-keyval";

// An upload session persisted to IndexedDB so it survives tab close/crash; file bytes ride along via
// structured clone. `TPayload` is whatever the feature needs to re-run the upload (engine-agnostic).
export type PersistedUpload<TPayload> = {
  id: string;
  createdAt: number;
  // Set once init succeeds; presence lets resume continue the existing session instead of recreating it.
  slug?: string;
  payload: TPayload;
};

// Dedicated store so pending uploads never collide with other app state.
const store = createStore("hobbyist-uploads", "pending");

export const saveUpload = <TPayload>(record: PersistedUpload<TPayload>): Promise<void> =>
  set(record.id, record, store);

export const deleteUpload = (id: string): Promise<void> => del(id, store);

// Oldest first, so a resume sweep replays them in the order they were queued.
export const listUploads = async <TPayload>(): Promise<PersistedUpload<TPayload>[]> => {
  const records = (await entries<string, PersistedUpload<TPayload>>(store)).map(([, value]) => value);
  return records.sort((a, b) => a.createdAt - b.createdAt);
};
