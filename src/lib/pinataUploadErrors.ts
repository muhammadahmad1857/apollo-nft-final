/** Turn raw tus / Pinata errors into user-facing messages. */
export function formatPinataUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Upload-Length exceeds maximum upload size")) {
    return "This file is too large for your Pinata account. Check your plan storage and per-file limits, or try a smaller file.";
  }

  if (message.includes("413")) {
    return "Upload rejected — file too large for Pinata. Verify your Pinata plan supports files this size.";
  }

  return message;
}
