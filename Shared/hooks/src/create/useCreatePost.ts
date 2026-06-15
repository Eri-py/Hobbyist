import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosInstance } from "axios";

import { CreateFormSchema, type CreateFormSchemaTypes } from "@hobbyist/form-schemas";
import { createUploadEngine, type UploadSource, type UploadTransport } from "../upload/uploadEngine";
import { createPostUploadResource, type CreatePostPayload } from "./postUploadResource";

/**
 * Create-post form hook: owns the form and snapshots it into a self-contained payload, then drives
 * the generic upload engine through the posts-specific resource. `TFile` is the platform file handle.
 */
export function useCreatePost<TFile>(
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

  const resource = createPostUploadResource<TFile>(axiosInstance);
  const { submit, resume } = createUploadEngine<TFile, CreatePostPayload<TFile>>(resource, transport);

  // Snapshots the live form + ordered sources into a self-contained payload (empty metadata -> null).
  const buildPayload = (
    sources: UploadSource<TFile>[],
    publish: boolean,
  ): CreatePostPayload<TFile> => ({
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
