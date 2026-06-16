import type { UploadTransport } from "@hobbyist/hooks";

/** PUTs file bytes to storage's pre-signed URL; bypasses axiosInstance (no cookies/auth) — headers verbatim or the sig fails. */
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
