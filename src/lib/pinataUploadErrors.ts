/** Turn raw tus / Pinata errors into user-facing messages. */
export function formatPinataUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Upload-Length exceeds maximum upload size")) {
    return "Pinata rejected this upload size. Ensure you have enough storage quota left on your Pinata account and that the file is under 25 GB.";
  }

  if (message.includes("413")) {
    return "Upload rejected — file too large for Pinata. Verify your Pinata plan supports files this size.";
  }

  return message;
}
