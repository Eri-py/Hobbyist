import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError, type AxiosInstance } from "axios";

import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import type { components } from "@hobbyist/types";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

type InitPostRequest = components["schemas"]["InitPostRequest"];
type InitPostResponse = components["schemas"]["InitPostResponse"];
type PresignedUpload = components["schemas"]["PresignedUpload"];
type FinalizeResponse = components["schemas"]["FinalizeResponse"];
type FinalizeRequest = components["schemas"]["FinalizeRequest"];
type MediaManifestItem = components["schemas"]["MediaManifestItem"];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
export const MAX_FILES = 15;

// Upload + finalize rounds per dispatch; each retry re-sends only what's still pending.
const MAX_SUBMIT_ATTEMPTS = 2;

// ---------------------------------------------------------------------------
// Upload seams (platform-specific bits injected by each client)
// ---------------------------------------------------------------------------

/** A file to upload + the metadata to sign it. `TFile` is the platform handle (web File / native asset). */
export type UploadSource<TFile = File> = {
  file: TFile;
  fileName: string;
  contentType: string;
  byteSize: number;
};

/** PUTs one file's bytes to its pre-signed target; must send every `upload.requiredHeaders` or the sig fails. */
export type UploadTransport<TFile = File> = (args: {
  file: TFile;
  upload: PresignedUpload;
}) => Promise<void>;

/** Post fields minus the media manifest (which is derived from the sources). */
export type PostMetadata = Omit<InitPostRequest, "media">;

/** Everything `submit` needs, form-independent — so it can be persisted and re-run later (resume/crash). */
export type UploadPayload<TFile = File> = {
  metadata: PostMetadata;
  sources: UploadSource<TFile>[];
  publish: boolean;
};

/** Receives the slug once a post exists, so the client can persist it for resume. */
export type SlugSink = (slug: string) => void | Promise<void>;

// A gone post (server GC reclaimed it) — resume falls back to recreating from scratch.
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
// Upload engine (form-independent — drives a self-contained payload)
// ---------------------------------------------------------------------------

export function createUploadEngine<TFile = File>(
  axiosInstance: AxiosInstance,
  transport: UploadTransport<TFile>,
) {
  const initApi = (body: InitPostRequest) =>
    axiosInstance.post<InitPostResponse>("posts/init", body);

  const finalizeApi = (slug: string, publish: boolean) =>
    axiosInstance.post<FinalizeResponse>(`posts/${slug}/finalize`, {
      publish,
    } satisfies FinalizeRequest);

  const buildInitBody = (payload: UploadPayload<TFile>): InitPostRequest => ({
    ...payload.metadata,
    media: buildManifest(payload.sources),
  });

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

  // Publish wants a published post; a draft only needs every byte verified (zero pending).
  const isDone = (payload: UploadPayload<TFile>, result: FinalizeResponse): boolean =>
    payload.publish ? result.published : result.pendingUploads.length === 0;

  // Upload + finalize, looping on what stays pending so each retry re-sends only the gaps. Rejects on giving up.
  const uploadAndFinalize = async (
    slug: string,
    payload: UploadPayload<TFile>,
    firstTargets: PresignedUpload[],
  ): Promise<void> => {
    let targets = firstTargets;
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_SUBMIT_ATTEMPTS; attempt++) {
      try {
        if (targets.length > 0) {
          await uploadTargets(targets, payload.sources);
        }
        const result = (await finalizeApi(slug, payload.publish)).data;
        if (isDone(payload, result)) return;
        targets = result.pendingUploads;
        lastError = new Error("Some files didn't finish uploading.");
      } catch (error) {
        lastError = error;
      }
    }
    throw (
      lastError ??
      new Error(
        payload.publish
          ? "We couldn't publish your post. Please try again."
          : "We couldn't save your draft. Please try again.",
      )
    );
  };

  // Create from scratch: init, hand the slug to onSlug (for resume persistence), then upload + finalize.
  const submit = async (payload: UploadPayload<TFile>, onSlug?: SlugSink): Promise<void> => {
    const { slug, uploads } = (await initApi(buildInitBody(payload))).data;
    await onSlug?.(slug);
    await uploadAndFinalize(slug, payload, uploads);
  };

  // Resume a persisted post: finalize reports what's missing, re-upload only those; 404 (GC'd) ⇒ recreate.
  const resume = async (
    slug: string,
    payload: UploadPayload<TFile>,
    onSlug?: SlugSink,
  ): Promise<void> => {
    let result: FinalizeResponse;
    try {
      result = (await finalizeApi(slug, payload.publish)).data;
    } catch (error) {
      if (isNotFound(error)) return submit(payload, onSlug);
      throw error;
    }
    if (isDone(payload, result)) return;
    await uploadAndFinalize(slug, payload, result.pendingUploads);
  };

  return { submit, resume };
}

// ---------------------------------------------------------------------------
// Hook (form + payload builder over the engine)
// ---------------------------------------------------------------------------

export function useCreatePost<TFile = File>(
  axiosInstance: AxiosInstance,
  transport: UploadTransport<TFile>,
) {
  const methods = useForm<CreateFormSchemaTypes>({
    mode: "onChange",
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      hobby: "",
      title: "",
      description: "",
      availableForTrade: false,
      lookingFor: "",
    },
  });

  const { submit, resume } = createUploadEngine<TFile>(axiosInstance, transport);

  // Snapshots the live form + ordered sources into a self-contained payload (empty metadata -> null).
  const buildPayload = (
    sources: UploadSource<TFile>[],
    publish: boolean,
  ): UploadPayload<TFile> => ({
    metadata: {
      hobby: methods.getValues("hobby") || null,
      title: methods.getValues("title") || null,
      description: methods.getValues("description") || null,
      availableForTrade: methods.getValues("availableForTrade"),
      lookingFor: methods.getValues("lookingFor") || null,
    },
    sources,
    publish,
  });

  return { methods, buildPayload, submit, resume };
}
