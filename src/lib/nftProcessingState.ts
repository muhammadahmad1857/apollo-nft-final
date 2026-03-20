const STORAGE_KEY = "apollo_nft_processing";

export type ProcessingStatus = "processing" | "ready";

interface ProcessingEntry {
  mediaUrl: string;
  status: ProcessingStatus;
  mintedAt: number;
  nftId: number;
}

type ProcessingStore = Record<string, ProcessingEntry>;

function readStore(): ProcessingStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as ProcessingStore;
  } catch {
    return {};
  }
}

function writeStore(store: ProcessingStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function markProcessing(mediaUrl: string, nftId: number): void {
  const store = readStore();
  store[mediaUrl] = { mediaUrl, status: "processing", mintedAt: Date.now(), nftId };
  writeStore(store);
}

export function markReady(mediaUrl: string): void {
  const store = readStore();
  if (store[mediaUrl]) {
    store[mediaUrl].status = "ready";
    writeStore(store);
  }
}

export function getProcessingStatus(mediaUrl: string): ProcessingStatus | null {
  const store = readStore();
  return store[mediaUrl]?.status ?? null;
}

export function getAllProcessing(): ProcessingEntry[] {
  return Object.values(readStore()).filter((e) => e.status === "processing");
}

/** Remove entries older than 24 hours to prevent unbounded localStorage growth. */
export function pruneStaleEntries(): void {
  const store = readStore();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let changed = false;
  for (const key of Object.keys(store)) {
    if (store[key].mintedAt < cutoff) {
      delete store[key];
      changed = true;
    }
  }
  if (changed) writeStore(store);
}
