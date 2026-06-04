import { formatBytes } from "@/lib/formatBytes";

/** Turn raw tus / Pinata errors into user-facing messages. */
export function formatPinataUploadError(error: unknown, fileSizeBytes?: number): string {
  const message = error instanceof Error ? error.message : String(error);
  const sizeHint =
    typeof fileSizeBytes === "number"
      ? ` Your file is ${formatBytes(fileSizeBytes)} (${fileSizeBytes.toLocaleString()} bytes).`
      : "";

  if (message.includes("Upload-Length exceeds maximum upload size")) {
    return (
      "Pinata rejected this upload because Upload-Length exceeded the signed upload limit." +
      sizeHint +
      " Retry after refreshing the page so a new signed URL is created. If this persists for files under your configured cap, contact Pinata support with the upload request ID from the network tab."
    );
  }

  if (message.includes("413")) {
    return (
      "Upload rejected (413 — payload too large)." +
      sizeHint +
      " This can be a proxy request-body limit. Refresh and retry; if it continues, reduce proxy TUS chunk size (NEXT_PUBLIC_TUS_PROXY_CHUNK_BYTES)."
    );
  }

  return message;
}
