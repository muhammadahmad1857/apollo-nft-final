/** Turn raw tus / Pinata errors into user-facing messages. */
export function formatPinataUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Upload-Length exceeds maximum upload size")) {
    return "Pinata rejected this upload. Check that your Pinata account has enough remaining storage for the full file (Dashboard → Usage), and that the file is under 25 GB. Windows/macOS may show a rounded size (e.g. 11 GB) while the actual byte count is higher (~12 GB).";
  }

  if (message.includes("413")) {
    return "Upload rejected — file too large for Pinata. Verify your Pinata plan supports files this size.";
  }

  return message;
}
