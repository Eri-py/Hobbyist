import { isAxiosError } from "axios";

import type { components } from "@hobbyist/types";

type PresignedUpload = components["schemas"]["PresignedUpload"];
type MediaManifestItem = components["schemas"]["MediaManifestItem"];

export type { PresignedUpload };

// ---------------------------------------------------------------------------
// Media limits (shared by every upload feature's client-side validation)
// ---------------------------------------------------------------------------

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
export const MAX_FILES = 15;

// Upload + finalize rounds per dispatch; each retry re-sends only what's still pending.
const MAX_SUBMIT_ATTEMPTS = 2;

// ---------------------------------------------------------------------------
// Platform seams (injected by each client)
// ---------------------------------------------------------------------------

/** A file to upload + the metadata to sign it. `TFile` is the platform handle (web File / native asset). */
export type UploadSource<TFile> = {
  file: TFile;
  fileName: string;
  contentType: string;
  byteSize: number;
};

/** PUTs one file's bytes to its pre-signed target; must send every `upload.requiredHeaders` or the sig fails. */
export type UploadTransport<TFile> = (args: {
  file: TFile;
  upload: PresignedUpload;
}) => Promise<void>;

/** Receives the slug once a session exists, so the client can persist it for resume. */
export type SlugSink = (slug: string) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Resource seam (what a feature defines to drive the engine)
// ---------------------------------------------------------------------------

/** A started upload session: where to PUT each file. */
export type InitResult = { slug: string; uploads: PresignedUpload[] };

/** A finalize outcome: whether the session is complete, plus re-signed targets for anything still missing. */
export type FinalizeResult = { done: boolean; pendingUploads: PresignedUpload[] };

/** The minimum a payload must carry; features extend it with their own metadata. */
export type UploadPayloadBase<TFile> = { sources: UploadSource<TFile>[] };

/** Feature-specific API: how to start a session and how to finalize/verify it. The engine owns everything else. */
export type UploadResource<TPayload> = {
  init: (payload: TPayload) => Promise<InitResult>;
  finalize: (slug: string, payload: TPayload) => Promise<FinalizeResult>;
};

/** What the engine exposes: create from scratch, or resume a persisted session by slug. */
export type UploadEngine<TPayload> = {
  submit: (payload: TPayload, onSlug?: SlugSink) => Promise<void>;
  resume: (slug: string, payload: TPayload, onSlug?: SlugSink) => Promise<void>;
};

// A gone session (server GC reclaimed it) — resume falls back to recreating from scratch.
const isNotFound = (error: unknown): boolean =>
  isAxiosError(error) && error.response?.status === 404;

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/** Ordered sources → manifest; 1-based position is display order and the handle pairing a PresignedUpload to its file. */
export function buildManifest(sources: UploadSource<unknown>[]): MediaManifestItem[] {
  return sources.map((source, index) => ({
    position: index + 1,
    fileName: source.fileName,
    contentType: source.contentType,
    byteSize: source.byteSize,
  }));
}

// ---------------------------------------------------------------------------
// Engine (pure orchestration — resource-agnostic)
// ---------------------------------------------------------------------------

export function createUploadEngine<TFile, TPayload extends UploadPayloadBase<TFile>>(
  resource: UploadResource<TPayload>,
  transport: UploadTransport<TFile>,
): UploadEngine<TPayload> {
  // PUTs each target (position N → sources[N-1]); allSettled so one failure doesn't abort the rest.
  const uploadTargets = async (
    targets: PresignedUpload[],
    sources: UploadSource<TFile>[],
  ): Promise<void> => {
    await Promise.allSettled(
      targets.map((upload) => {
        const source = sources[Number(upload.position) - 1];
        if (!source) {
          return Promise.reject(new Error(`No file for upload position ${upload.position}`));
        }
        return transport({ file: source.file, upload });
      }),
    );
  };

  // Upload + finalize, looping on what stays pending so each retry re-sends only the gaps. Rejects on giving up.
  const uploadAndFinalize = async (
    slug: string,
    payload: TPayload,
    firstTargets: PresignedUpload[],
  ): Promise<void> => {
    let targets = firstTargets;
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_SUBMIT_ATTEMPTS; attempt++) {
      try {
        if (targets.length > 0) {
          await uploadTargets(targets, payload.sources);
        }
        const result = await resource.finalize(slug, payload);
        if (result.done) return;
        targets = result.pendingUploads;
        lastError = new Error("Some files didn't finish uploading.");
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("We couldn't finish uploading your files.");
  };

  // Create from scratch: init, hand the slug to onSlug (for resume persistence), then upload + finalize.
  const submit = async (payload: TPayload, onSlug?: SlugSink): Promise<void> => {
    const { slug, uploads } = await resource.init(payload);
    await onSlug?.(slug);
    await uploadAndFinalize(slug, payload, uploads);
  };

  // Resume a persisted session: finalize reports what's missing, re-upload only those; 404 (GC'd) ⇒ recreate.
  const resume = async (slug: string, payload: TPayload, onSlug?: SlugSink): Promise<void> => {
    let result: FinalizeResult;
    try {
      result = await resource.finalize(slug, payload);
    } catch (error) {
      if (isNotFound(error)) return submit(payload, onSlug);
      throw error;
    }
    if (result.done) return;
    await uploadAndFinalize(slug, payload, result.pendingUploads);
  };

  return { submit, resume };
}
