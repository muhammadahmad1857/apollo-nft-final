/* eslint-disable @typescript-eslint/no-explicit-any */

function toHexChainId(chainId: any) {
  if (typeof chainId === "string") {
    if (chainId.startsWith("0x")) return chainId;
    const asNum = Number(chainId);
    if (!Number.isNaN(asNum)) return `0x${asNum.toString(16)}`;
    return chainId;
  }
  if (typeof chainId === "number") return `0x${chainId.toString(16)}`;
  return "0x1";
}

function normalizeAccounts(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) return [value];
  if (value && Array.isArray(value.accounts)) return value.accounts;
  return [];
}

function looksLikeProvider(value: any) {
  if (!value || typeof value !== "object") return false;
  return (
    typeof value.request === "function" ||
    typeof value.requestAccounts === "function" ||
    typeof value.getAccounts === "function" ||
    typeof value.connect === "function"
  );
}

function pickBestProvider(candidates: any[]) {
  const valid = candidates.filter(Boolean).filter(looksLikeProvider);
  if (valid.length === 0) return undefined;

  // Prefer explicit EVM/provider-like entries first.
  const preferred = valid.find((p: any) => p?.isMuses || p?.isMusesWallet || p?.isMusesProvider);
  if (preferred) return preferred;

  const withRequest = valid.find((p: any) => typeof p.request === "function");
  if (withRequest) return withRequest;

  return valid[0];
}

function toEip1193Provider(raw: any) {
  if (!raw) return undefined;
  if (typeof raw.request === "function") return raw;

  // Adapter for non-standard providers that expose requestAccounts/getAccounts/getChain APIs.
  return {
    ...raw,
    async request({ method, params }: { method: string; params?: any[] }) {
      switch (method) {
        case "eth_requestAccounts": {
          if (typeof raw.requestAccounts === "function") {
            return normalizeAccounts(await raw.requestAccounts());
          }
          if (typeof raw.connect === "function") {
            return normalizeAccounts(await raw.connect());
          }
          if (typeof raw.getAccounts === "function") {
            return normalizeAccounts(await raw.getAccounts());
          }
          throw new Error("Muses provider does not support account requests");
        }
        case "eth_accounts": {
          if (typeof raw.getAccounts === "function") {
            return normalizeAccounts(await raw.getAccounts());
          }
          if (typeof raw.requestAccounts === "function") {
            return normalizeAccounts(await raw.requestAccounts());
          }
          return [];
        }
        case "eth_chainId": {
          if (typeof raw.getChain === "function") return toHexChainId(await raw.getChain());
          if (typeof raw.getNetwork === "function") return toHexChainId(await raw.getNetwork());
          return "0x1";
        }
        case "wallet_switchEthereumChain": {
          const target = params?.[0]?.chainId;
          const normalized = typeof target === "string" && target.startsWith("0x")
            ? parseInt(target, 16)
            : Number(target);
          if (typeof raw.switchChain === "function") return raw.switchChain(normalized);
          if (typeof raw.switchNetwork === "function") return raw.switchNetwork(normalized);
          throw new Error("Muses provider does not support chain switching");
        }
        default: {
          // Best-effort fallback for provider-specific request methods.
          if (typeof raw._request === "function") {
            return raw._request({ method, params });
          }
          if (typeof raw.request === "function") {
            return raw.request({ method, params });
          }
          throw new Error(`Unsupported method on Muses adapter: ${method}`);
        }
      }
    },
    on:
      typeof raw.on === "function"
        ? raw.on.bind(raw)
        : () => undefined,
    removeListener:
      typeof raw.removeListener === "function"
        ? raw.removeListener.bind(raw)
        : () => undefined,
  };
}

export function getMusesProvider() {
  if (typeof window === "undefined") return undefined;
  const win = window as any;

  const muses = win?.muses;
  const raw = pickBestProvider([
    muses?.ethereum,
    muses?.evm,
    muses?.provider,
    muses?.ethereumProvider,
    muses?.providers?.ethereum,
    muses?.providers?.evm,
    muses?.wallet,
    muses,
    win?.ethereum?.providers &&
      Array.isArray(win.ethereum.providers) &&
      win.ethereum.providers.find(
        (p: any) => p?.isMuses || p?.isMusesWallet || p?.isMusesProvider
      ),
  ]);

  return toEip1193Provider(raw);
}

export function installPreferredMusesProvider() {
  if (typeof window === "undefined") return false;
  const win = window as any;
  const muses = getMusesProvider();
  if (!muses) return false;
  win.ethereum = muses;
  return true;
}
