import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosInstance } from "axios";

import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import type { components } from "@hobbyist/types";

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

type InitPublishRequest = components["schemas"]["InitPublishRequest"];
type InitDraftRequest = components["schemas"]["InitDraftRequest"];
type InitPostResponse = components["schemas"]["InitPostResponse"];
type PresignedUpload = components["schemas"]["PresignedUpload"];
type FinalizeResponse = components["schemas"]["FinalizeResponse"];
type MediaManifestItem = components["schemas"]["MediaManifestItem"];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
export const MAX_FILES = 15;

// One init → upload → finalize round, plus a single recreate on failure.
const MAX_PUBLISH_ATTEMPTS = 2;

// ---------------------------------------------------------------------------
// Upload seams (platform-specific bits injected by each client)
// ---------------------------------------------------------------------------

/**
 * A file the client wants uploaded, paired with the metadata the server needs
 * to sign it. `TFile` is the platform's raw handle — a `File` on web, an asset
 * descriptor on native — and is forwarded untouched to the transport.
 */
export type UploadSource<TFile = File> = {
  file: TFile;
  fileName: string;
  contentType: string;
  byteSize: number;
};

/**
 * PUTs one file's bytes directly to storage using its pre-signed target. Web
 * uses fetch/XHR; native uses an OS background-upload task. Must send every
 * header in `upload.requiredHeaders` or the signature won't match.
 */
export type UploadTransport<TFile = File> = (args: {
  file: TFile;
  upload: PresignedUpload;
}) => Promise<void>;

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

/**
 * Turns the ordered sources into the upload manifest. Array order is the source
 * of truth for display order — position is 1-based and doubles as the handle
 * that pairs a returned PresignedUpload back to its file.
 */
export function buildManifest(sources: UploadSource<unknown>[]): MediaManifestItem[] {
  return sources.map((source, index) => ({
    position: index + 1,
    fileName: source.fileName,
    contentType: source.contentType,
    byteSize: source.byteSize,
  }));
}

// ---------------------------------------------------------------------------
// Hook
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

  // API functions
  const initApi = (body: InitPublishRequest) =>
    axiosInstance.post<InitPostResponse>("posts/init", body);

  const initDraftApi = (body: InitDraftRequest) =>
    axiosInstance.post<InitPostResponse>("posts/init-draft", body);

  const finalizeApi = (slug: string) =>
    axiosInstance.post<FinalizeResponse>(`posts/${slug}/finalize`);

  const discardApi = (slug: string) => axiosInstance.delete(`posts/${slug}`);

  // Uploads every file to its matching pre-signed target in parallel. Sources
  // are position-ordered, so position N maps to sources[N - 1].
  const uploadAll = (uploads: PresignedUpload[], sources: UploadSource<TFile>[]) =>
    Promise.all(
      uploads.map((upload) => {
        const source = sources[Number(upload.position) - 1];
        if (!source) {
          throw new Error(`No file for upload position ${upload.position}`);
        }
        return transport({ file: source.file, upload });
      }),
    );

  // One full publish round. Leaves no orphan behind: any incomplete or failed
  // attempt discards its post so the next attempt recreates cleanly.
  const attemptPublish = async (
    body: InitPublishRequest,
    sources: UploadSource<TFile>[],
  ): Promise<FinalizeResponse> => {
    const { slug, uploads } = (await initApi(body)).data;
    try {
      await uploadAll(uploads, sources);
      const result = (await finalizeApi(slug)).data;
      if (!result.published) {
        await discardApi(slug).catch(() => {});
      }
      return result;
    } catch (error) {
      await discardApi(slug).catch(() => {});
      throw error;
    }
  };

  // Publish: fire-and-forget and optimistic. The caller navigates away
  // immediately; the upload runs in-page. On failure we recreate from the
  // local copy (Instagram-style), then give up — a never-published post is an
  // invisible draft-state row the server GC sweep reclaims.
  const createPost = (sources: UploadSource<TFile>[]) => {
    const body: InitPublishRequest = {
      hobby: methods.getValues("hobby"),
      title: methods.getValues("title"),
      description: methods.getValues("description"),
      availableForTrade: methods.getValues("availableForTrade"),
      lookingFor: methods.getValues("lookingFor") || null,
      media: buildManifest(sources),
    };

    void (async () => {
      for (let attempt = 1; attempt <= MAX_PUBLISH_ATTEMPTS; attempt++) {
        try {
          const result = await attemptPublish(body, sources);
          if (result.published) return;
        } catch {
          // Network/upload failure — recreate on the next attempt.
        }
      }
    })();
  };

  // Draft save: awaited so the blocker dialog can show progress and surface
  // failure. Unlike publish there's no finalize — the post stays Draft for the
  // user to publish later. A failed upload discards the partial draft so a
  // retry starts clean (the form still holds everything locally).
  const saveDraftMutation = useMutation({
    mutationFn: async (sources: UploadSource<TFile>[]) => {
      const body: InitDraftRequest = {
        hobby: methods.getValues("hobby") || null,
        title: methods.getValues("title") || null,
        description: methods.getValues("description") || null,
        availableForTrade: methods.getValues("availableForTrade"),
        lookingFor: methods.getValues("lookingFor") || null,
        media: buildManifest(sources),
      };

      const { slug, uploads } = (await initDraftApi(body)).data;
      try {
        await uploadAll(uploads, sources);
      } catch (error) {
        await discardApi(slug).catch(() => {});
        throw error;
      }
      return slug;
    },
  });

  return {
    methods,
    createPost,
    saveDraft: (sources: UploadSource<TFile>[]) => saveDraftMutation.mutateAsync(sources),
    isSavingDraft: saveDraftMutation.isPending,
  };
}
