import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import type { ServerError } from "@hobbyist/hooks";
import { axiosInstance } from "@/api/axiosInstance";
import type { FileWithMetadata } from "@/hooks/create/useMediaUpload";
import type { CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import type { components } from "@hobbyist/types";

// --- DTOs ---

type CreatePostResponse = components["schemas"]["CreatePostResponse"];
type CreateDraftResponse = components["schemas"]["CreateDraftResponse"];
type AddDraftMediaResponse = components["schemas"]["AddDraftMediaResponse"];

// --- API ---

const createDraftApi = (media: File[]) => {
  const formData = new FormData();
  media.forEach((f) => formData.append("media", f));
  return axiosInstance.post<CreateDraftResponse>("posts/draft", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const addMediaApi = (postId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosInstance.post<AddDraftMediaResponse>(`posts/${postId}/media`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const removeMediaApi = (postId: string, objectKey: string) =>
  axiosInstance.delete(`posts/${postId}/media`, { data: { objectKey } });

const publishPostApi = (postId: string, values: CreateFormSchemaTypes) =>
  axiosInstance.post<CreatePostResponse>(`posts/${postId}/publish`, values);

const discardDraftApi = (postId: string) => axiosInstance.delete(`posts/${postId}`);

// --- Types ---

type UseDraftPostOptions = {
  onPostCreated: (postId: string) => void;
  onError: (error: ServerError) => void;
};

// --- Hook ---

/**
 * Manages the full lifecycle of a draft post:
 *   create → add/remove media → publish or discard.
 *
 * Returns stable callbacks that useMediaUpload and useCreate can consume
 * without triggering unnecessary re-renders.
 */
export function useDraftPost({ onPostCreated, onError }: UseDraftPostOptions) {
  const [draftPostId, setDraftPostId] = useState<string | null>(null);

  // Ref so callbacks read the latest draft ID without being recreated on every
  // state change, which would cause useMediaUpload's dropzone to reinitialise.
  const draftPostIdRef = useRef<string | null>(null);
  draftPostIdRef.current = draftPostId;

  // Maps each local FileWithMetadata.id to its server-assigned S3 objectKey
  // so individual files can be removed from the draft by the caller.
  const fileObjectKeys = useRef(new Map<string, string>());

  // --- Mutations ---

  const createDraftMutation = useMutation({
    mutationFn: ({ files }: { files: File[]; fileIds: string[] }) => createDraftApi(files),
    onSuccess: (response, variables) => {
      const { postId, mediaObjectKeys } = response.data;
      setDraftPostId(postId);
      draftPostIdRef.current = postId;
      variables.fileIds.forEach((id, i) => {
        fileObjectKeys.current.set(id, mediaObjectKeys[i]);
      });
    },
    onError,
  });

  const addMediaMutation = useMutation({
    mutationFn: ({ postId, file }: { postId: string; file: File; fileId: string }) =>
      addMediaApi(postId, file),
    onSuccess: (response, variables) => {
      fileObjectKeys.current.set(variables.fileId, response.data.objectKey);
    },
    onError,
  });

  const removeMediaMutation = useMutation({
    mutationFn: ({ postId, objectKey }: { postId: string; objectKey: string; fileId: string }) =>
      removeMediaApi(postId, objectKey),
    onSuccess: (_, variables) => {
      fileObjectKeys.current.delete(variables.fileId);
    },
    onError,
  });

  const publishPostMutation = useMutation({
    mutationFn: ({ postId, values }: { postId: string; values: CreateFormSchemaTypes }) =>
      publishPostApi(postId, values),
    onSuccess: (response) => {
      setDraftPostId(null);
      draftPostIdRef.current = null;
      fileObjectKeys.current.clear();
      onPostCreated(response.data.postId);
    },
    onError,
  });

  const discardDraftMutation = useMutation({
    mutationFn: (postId: string) => discardDraftApi(postId),
    onSuccess: () => {
      setDraftPostId(null);
      draftPostIdRef.current = null;
      fileObjectKeys.current.clear();
    },
    onError,
  });

  // --- Callbacks ---

  /**
   * Pass to useMediaUpload. Called after new files are processed locally.
   * Creates the draft on the first batch; adds to the existing draft on
   * subsequent drops (e.g. the user adds more files to the web carousel).
   */
  const onFilesAdded = useCallback(
    (newFiles: FileWithMetadata[]) => {
      if (newFiles.length === 0) return;

      const currentDraftId = draftPostIdRef.current;

      if (!currentDraftId) {
        createDraftMutation.mutate({
          files: newFiles.map((f) => f.file),
          fileIds: newFiles.map((f) => f.id),
        });
      } else {
        newFiles.forEach((f) =>
          addMediaMutation.mutate({ postId: currentDraftId, file: f.file, fileId: f.id }),
        );
      }
    },
    // mutate references are stable; draftPostIdRef is always current via the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createDraftMutation.mutate, addMediaMutation.mutate],
  );

  /**
   * Pass to useMediaUpload. Called when a file is removed from the carousel.
   * Deletes the corresponding S3 object from the active draft.
   */
  const onFileRemoved = useCallback(
    (fileId: string) => {
      const currentDraftId = draftPostIdRef.current;
      if (!currentDraftId) return;

      const objectKey = fileObjectKeys.current.get(fileId);
      if (!objectKey) return;

      removeMediaMutation.mutate({ postId: currentDraftId, objectKey, fileId });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [removeMediaMutation.mutate],
  );

  /**
   * Discards the current draft and clears all local draft state.
   * Safe to call when no draft exists — it is a no-op in that case.
   */
  const discardDraft = useCallback(() => {
    const currentDraftId = draftPostIdRef.current;
    if (!currentDraftId) return;
    discardDraftMutation.mutate(currentDraftId);
  }, [discardDraftMutation.mutate]);

  /**
   * Publishes the active draft with the supplied form values.
   * Callers should guard that `draftPostIdRef.current` is non-null before calling.
   */
  const publishDraft = useCallback(
    (postId: string, values: CreateFormSchemaTypes) => {
      publishPostMutation.mutate({ postId, values });
    },
    [publishPostMutation.mutate],
  );

  return {
    // Ref — lets consumers (useCreate) check draft existence without causing re-renders.
    draftPostIdRef,

    // Callbacks wired into useMediaUpload
    onFilesAdded,
    onFileRemoved,
    discardDraft,

    // Called by useCreate on form submit
    publishDraft,

    // Loading states
    isUploadingMedia: createDraftMutation.isPending || addMediaMutation.isPending,
    isRemovingMedia: removeMediaMutation.isPending,
    isPublishing: publishPostMutation.isPending,
  };
}
