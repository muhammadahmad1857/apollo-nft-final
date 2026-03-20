export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}

export function formatUploadProgress(bytesSent: number, bytesTotal: number): string {
  return `${formatBytes(bytesSent)} / ${formatBytes(bytesTotal)}`;
}
