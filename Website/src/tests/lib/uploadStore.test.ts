import { beforeEach, describe, it, expect, vi } from "vitest";

// In-memory stand-in for idb-keyval, so the suite needs neither IndexedDB nor a polyfill dep. It
// exercises our wrapper logic (oldest-first ordering, save/delete/overwrite by id); real IndexedDB
// blob byte-fidelity is a browser guarantee, verified in-app rather than here.
vi.mock("idb-keyval", () => {
  const data = new Map<IDBValidKey, unknown>();
  return {
    createStore: () => ({}),
    set: async (key: IDBValidKey, value: unknown) => void data.set(key, value),
    del: async (key: IDBValidKey) => void data.delete(key),
    entries: async () => [...data.entries()],
  };
});

import { saveUpload, deleteUpload, listUploads, type PersistedUpload } from "@/lib/uploadStore";
import type { CreatePostPayload } from "@hobbyist/hooks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makePayload = (publish: boolean, fileBody = "hello"): CreatePostPayload<File> => ({
  metadata: {
    hobby: "Painting",
    title: "A title",
    description: "A description",
    availableForTrade: false,
    lookingFor: null,
  },
  sources: [
    {
      file: new File([fileBody], "a.jpg", { type: "image/jpeg" }),
      fileName: "a.jpg",
      contentType: "image/jpeg",
      byteSize: fileBody.length,
    },
  ],
  publish,
});

const makeRecord = (
  id: string,
  createdAt: number,
  publish = true,
): PersistedUpload<CreatePostPayload<File>> => ({
  id,
  createdAt,
  payload: makePayload(publish),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("uploadStore", () => {
  beforeEach(async () => {
    for (const record of await listUploads()) {
      await deleteUpload(record.id);
    }
  });

  it("returns an empty list when nothing is stored", async () => {
    expect(await listUploads()).toEqual([]);
  });

  it("persists an upload under its id and lists it back", async () => {
    await saveUpload(makeRecord("a", 1, false));

    const [stored] = await listUploads<CreatePostPayload<File>>();
    expect(stored.id).toBe("a");
    expect(stored.payload.publish).toBe(false);
    expect(stored.payload.metadata.title).toBe("A title");
    // The source descriptor (what the manifest is built from) is preserved.
    expect(stored.payload.sources[0].fileName).toBe("a.jpg");
    expect(stored.payload.sources[0].contentType).toBe("image/jpeg");
    expect(stored.payload.sources[0].byteSize).toBe(5);
  });

  it("deletes a single upload by id, leaving the rest", async () => {
    await saveUpload(makeRecord("a", 1));
    await saveUpload(makeRecord("b", 2));

    await deleteUpload("a");

    const remaining = await listUploads();
    expect(remaining.map((r) => r.id)).toEqual(["b"]);
  });

  it("lists uploads oldest first regardless of insertion order", async () => {
    await saveUpload(makeRecord("c", 300));
    await saveUpload(makeRecord("a", 100));
    await saveUpload(makeRecord("b", 200));

    expect((await listUploads()).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("overwrites an existing record with the same id", async () => {
    await saveUpload(makeRecord("a", 1, true));
    await saveUpload(makeRecord("a", 1, false));

    const all = await listUploads<CreatePostPayload<File>>();
    expect(all).toHaveLength(1);
    expect(all[0].payload.publish).toBe(false);
  });
});
