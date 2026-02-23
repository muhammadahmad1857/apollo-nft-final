export function resolveIPFS(url: string) {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    const hash = url.replace("ipfs://", "");
    return `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${hash}`;
  }
  return url;
}
