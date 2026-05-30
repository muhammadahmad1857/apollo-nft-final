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
      "Pinata rejected the upload size cap on this transfer." +
      sizeHint +
      " If this keeps happening with a file under 25 GB, email team@pinata.cloud with the upload ID from your browser network tab."
    );
  }

  if (message.includes("413")) {
    return (
      "Upload rejected (413 — payload too large)." +
      sizeHint +
      " Try again after redeploying; if it persists, contact Pinata support."
    );
  }

  return message;
}
