import type { AxiosInstance } from "axios";

import type { components } from "@hobbyist/types";
import {
  buildManifest,
  type UploadResource,
  type UploadPayloadBase,
} from "../upload/uploadEngine";

type InitPostRequest = components["schemas"]["InitPostRequest"];
type InitPostResponse = components["schemas"]["InitPostResponse"];
type FinalizeResponse = components["schemas"]["FinalizeResponse"];
type FinalizeRequest = components["schemas"]["FinalizeRequest"];

/** Post fields minus the media manifest (which is derived from the sources). */
export type PostMetadata = Omit<InitPostRequest, "media">;

/** Everything the engine needs for a create-post session — form-independent, so it can be persisted and resumed. */
export type CreatePostPayload<TFile> = UploadPayloadBase<TFile> & {
  metadata: PostMetadata;
  publish: boolean;
};

/** The posts-specific adapter: the only place the engine touches the posts/* endpoints. */
export function createPostUploadResource<TFile>(
  axiosInstance: AxiosInstance,
): UploadResource<CreatePostPayload<TFile>> {
  return {
    init: async (payload) => {
      const body: InitPostRequest = { ...payload.metadata, media: buildManifest(payload.sources) };
      const { data } = await axiosInstance.post<InitPostResponse>("posts/init", body);
      return { slug: data.slug, uploads: data.uploads };
    },
    finalize: async (slug, payload) => {
      const { data } = await axiosInstance.post<FinalizeResponse>(`posts/${slug}/finalize`, {
        publish: payload.publish,
      } satisfies FinalizeRequest);
      // Publish wants a published post; a draft only needs every byte verified (zero pending).
      const done = payload.publish ? data.published : data.pendingUploads.length === 0;
      return { done, pendingUploads: data.pendingUploads };
    },
  };
}
