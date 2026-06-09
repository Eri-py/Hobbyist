import type { UploadTransport } from "@hobbyist/hooks";

/**
 * Sends a file's bytes straight to object storage using its pre-signed PUT
 * URL. This deliberately bypasses axiosInstance: the request goes to storage,
 * not our API, so it must carry no cookies or baseURL and must skip the auth
 * refresh interceptor. Every signed header has to be sent verbatim or the
 * signature check fails.
 */
export const uploadToStorage: UploadTransport<File> = async ({ file, upload }) => {
  const response = await fetch(upload.url, {
    method: "PUT",
    headers: upload.requiredHeaders,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed for position ${upload.position} (status ${response.status}).`);
  }
};
