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
  const adapter: any = {
    ...raw,
    async request({ method, params }: { method: string; params?: any[] }) {
      console.debug("muses-provider.request -> method:", method, "params:", params);
      try {
        let result: any;
        const isEthAddress = (a: any) => typeof a === 'string' && /^0x[a-fA-F0-9]{40}$/.test(a);

        switch (method) {
          case "eth_requestAccounts": {
            if (typeof raw.requestAccounts === "function") {
              result = normalizeAccounts(await raw.requestAccounts());
              break;
            }
            if (typeof raw.connect === "function") {
              result = normalizeAccounts(await raw.connect());
              break;
            }
            if (typeof raw.getAccounts === "function") {
              result = normalizeAccounts(await raw.getAccounts());
              break;
            }

            throw new Error("Muses provider does not support account requests");
          }
          case "eth_accounts": {
            if (typeof raw.getAccounts === "function") {
              result = normalizeAccounts(await raw.getAccounts());
              break;
            }
            if (typeof raw.requestAccounts === "function") {
              result = normalizeAccounts(await raw.requestAccounts());
              break;
            }
            result = [];
            break;
          }
          case "eth_chainId": {
            if (typeof raw.getChain === "function") result = toHexChainId(await raw.getChain());
            else if (typeof raw.getNetwork === "function") result = toHexChainId(await raw.getNetwork());
            else result = "0x1";
            break;
          }
          case "wallet_switchEthereumChain": {
            const target = params?.[0]?.chainId;
            const normalized = typeof target === "string" && target.startsWith("0x")
              ? parseInt(target, 16)
              : Number(target);
            if (typeof raw.switchChain === "function") {
              result = await raw.switchChain(normalized);
              break;
            }
            if (typeof raw.switchNetwork === "function") {
              result = await raw.switchNetwork(normalized);
              break;
            }
            throw new Error("Muses provider does not support chain switching");
          }
          default: {
            // Best-effort fallback for provider-specific request methods.
            if (typeof raw._request === "function") {
              result = await raw._request({ method, params });
              break;
            }
            if (typeof raw.request === "function") {
              result = await raw.request({ method, params });
              break;
            }
            throw new Error(`Unsupported method on Muses adapter: ${method}`);
          }
        }
        console.debug("muses-provider.request <- raw result for", method, result);
        // Filter returned accounts to only valid EVM hex addresses (0x-prefixed 40 hex chars)
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
          try {
            const rawAccounts = normalizeAccounts(result);
            const ethAccounts = rawAccounts.filter(isEthAddress);
            if (ethAccounts.length !== rawAccounts.length) {
              console.debug('muses-provider: filtered non-EVM accounts out:', rawAccounts.filter((a: any) => !isEthAddress(a)));
            }
            result = ethAccounts;
          } catch (e) {
            console.debug('muses-provider: error filtering accounts', e);
          }
        }
        // If the method was eth_requestAccounts and result contains accounts, try to emit accountsChanged on raw/adapter
        try {
          const accounts = normalizeAccounts(result);
          if (method === "eth_requestAccounts" && accounts.length && typeof adapter.on === "function") {
            // emit accountsChanged so listeners (like wagmi) can react
            try {
              if (typeof adapter.emit === 'function') {
                adapter.emit('accountsChanged', accounts);
              } else if (typeof raw.on === 'function' && typeof raw.emit === 'function') {
                raw.emit('accountsChanged', accounts);
              }
            } catch (e) {
              // ignore emit failures
            }
          }
        } catch (e) {
          // ignore
        }
        return result;
      } catch (err) {
        console.debug("muses-provider.request <- error for", method, err);
        throw err;
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

  // Attach passive listeners to the raw provider so we log events from the extension.
  try {
    const tryOn = (evt: string) => {
      try {
        if (typeof raw.on === 'function') {
          raw.on(evt, (...args: any[]) => {
            console.debug(`muses-provider.event -> ${evt}`, args);
          });
        }
      } catch (e) {
        console.debug('muses-provider: failed to attach listener', evt, e);
      }
    };
    ['accountsChanged', 'chainChanged', 'connect', 'disconnect', 'message'].forEach(tryOn);
  } catch (e) {
    console.debug('muses-provider: attach listeners error', e);
  }

  return adapter;
}

export function getMusesProvider() {
  if (typeof window === "undefined") return undefined;
  const win = window as any;

  const muses = win?.muses;
  const candidates = [
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
  ];

  // Debug: list candidate shapes
  try {
    console.debug("muses-provider: candidates keys:", candidates.map((c) => (c && typeof c === 'object') ? Object.keys(c).slice(0,10) : c));
  } catch (e) {
    console.debug("muses-provider: error listing candidates", e);
  }

  const raw = pickBestProvider(candidates);
  console.debug("muses-provider: picked raw provider:", raw && (typeof raw === 'object' ? Object.keys(raw).slice(0,20) : raw));

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
