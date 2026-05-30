/* eslint-disable @typescript-eslint/no-explicit-any */

import { apolloMainnet } from "./apollo-chain";

const APOLLO_CHAIN_HEX = `0x${apolloMainnet.id.toString(16)}`;

export const APOLLO_WALLET_CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/apollo-wallet/mnpnahmgchhkjphkkemhbnjedajbcbll";

const APOLLO_PROVIDER_FLAGS = [
  "isApolloWallet",
  "isApollo",
  "isMuses",
  "isMusesWallet",
  "isMusesProvider",
] as const;

let eip6963ApolloProvider: any;
let eip6963ApolloRdns: string | undefined;

function isApolloAnnouncement(info: { name?: string; rdns?: string } | undefined) {
  const name = String(info?.name ?? "").toLowerCase();
  const rdns = String(info?.rdns ?? "").toLowerCase();
  return (
    name.includes("apollo") ||
    name.includes("muses") ||
    rdns.includes("apollo") ||
    rdns.includes("muses")
  );
}

function rememberAnnouncement(info: any, provider: any) {
  if (!isApolloAnnouncement(info) || !provider) return;
  eip6963ApolloProvider = provider;
  if (info?.rdns) eip6963ApolloRdns = info.rdns;
}

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event: Event) => {
    const detail = (event as CustomEvent).detail;
    rememberAnnouncement(detail?.info, detail?.provider);
  });
}

/** Ask installed extensions to announce themselves (EIP-6963). */
export function requestApolloWalletProviders() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

/**
 * Extensions often inject after React hydrates — poll briefly so RainbowKit
 * can detect Apollo Wallet as installed.
 */
export function initApolloWalletDiscovery() {
  if (typeof window === "undefined") return () => undefined;

  requestApolloWalletProviders();

  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    requestApolloWalletProviders();
    if (tries >= 24) window.clearInterval(timer);
  }, 250);

  return () => window.clearInterval(timer);
}

export function getApolloWalletRdns() {
  return eip6963ApolloRdns ?? "io.apollowallet";
}

function toHexChainId(chainId: any) {
  if (typeof chainId === "string") {
    if (chainId.startsWith("0x")) return chainId;
    if (/apollo|mainnet/i.test(chainId)) return APOLLO_CHAIN_HEX;
    const asNum = Number(chainId);
    if (!Number.isNaN(asNum)) return `0x${asNum.toString(16)}`;
    return APOLLO_CHAIN_HEX;
  }
  if (typeof chainId === "number") return `0x${chainId.toString(16)}`;
  return APOLLO_CHAIN_HEX;
}

function normalizeAccounts(value: any) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) return [value];
  if (value && Array.isArray(value.accounts)) return value.accounts;
  return [];
}

function isEthAddress(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
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

function isApolloLikeProvider(provider: any) {
  if (!provider || typeof provider !== "object") return false;
  if (APOLLO_PROVIDER_FLAGS.some((flag) => Boolean(provider[flag]))) return true;
  const label = String(provider?.providerInfo?.name ?? provider?.name ?? "").toLowerCase();
  return label.includes("apollo") || label.includes("muses");
}

function collectInjectedProviders(win: any) {
  const providers: any[] = [];

  if (Array.isArray(win.ethereum?.providers)) {
    providers.push(...win.ethereum.providers);
  } else if (win.ethereum) {
    providers.push(win.ethereum);
  }

  return providers;
}

async function resolveChainId(raw: any) {
  try {
    if (typeof raw.request === "function") {
      const chainId = await raw.request({ method: "eth_chainId" });
      if (chainId) return toHexChainId(chainId);
    }
    if (typeof raw.getChain === "function") return toHexChainId(await raw.getChain());
    if (typeof raw.getNetwork === "function") return toHexChainId(await raw.getNetwork());
    if (typeof raw.getChainId === "function") return toHexChainId(await raw.getChainId());
  } catch {
    // fall through
  }
  return APOLLO_CHAIN_HEX;
}

function createEventHub(raw: any) {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  const on = (event: string, listener: (...args: any[]) => void) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(listener);
    if (typeof raw.on === "function") raw.on(event, listener);
  };

  const removeListener = (event: string, listener: (...args: any[]) => void) => {
    listeners.get(event)?.delete(listener);
    if (typeof raw.removeListener === "function") raw.removeListener(event, listener);
  };

  const emit = (event: string, ...args: any[]) => {
    listeners.get(event)?.forEach((listener) => {
      try {
        listener(...args);
      } catch {
        // ignore listener errors
      }
    });
  };

  return { on, removeListener, emit };
}

async function requestAccounts(raw: any) {
  if (typeof raw.request === "function") {
    return normalizeAccounts(
      await raw.request({ method: "eth_requestAccounts" })
    );
  }
  if (typeof raw.requestAccounts === "function") {
    return normalizeAccounts(await raw.requestAccounts());
  }
  if (typeof raw.connect === "function") {
    return normalizeAccounts(await raw.connect());
  }
  if (typeof raw.getAccounts === "function") {
    return normalizeAccounts(await raw.getAccounts());
  }
  throw new Error("Apollo Wallet does not support account requests");
}

function wrapProvider(raw: any) {
  if (!raw) return undefined;

  const { on, removeListener, emit } = createEventHub(raw);

  const notifyConnected = async (accounts: string[]) => {
    if (!accounts.length) return;
    const chainId = await resolveChainId(raw);
    emit("accountsChanged", accounts);
    emit("connect", { chainId });
    emit("chainChanged", chainId);
  };

  const request = async ({ method, params }: { method: string; params?: any[] }) => {
    let result: any;

    switch (method) {
      case "eth_requestAccounts": {
        result = (await requestAccounts(raw)).filter(isEthAddress);
        await notifyConnected(result);
        return result;
      }
      case "eth_accounts": {
        if (typeof raw.request === "function") {
          result = normalizeAccounts(await raw.request({ method, params }));
        } else if (typeof raw.getAccounts === "function") {
          result = normalizeAccounts(await raw.getAccounts());
        } else {
          result = [];
        }
        return result.filter(isEthAddress);
      }
      case "eth_chainId": {
        return resolveChainId(raw);
      }
      case "wallet_switchEthereumChain": {
        const target = params?.[0]?.chainId;
        const normalized =
          typeof target === "string" && target.startsWith("0x")
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
        if (typeof raw.request === "function") {
          result = await raw.request({ method, params });
          break;
        }
        throw new Error("Apollo Wallet does not support chain switching");
      }
      case "wallet_addEthereumChain": {
        if (typeof raw.request === "function") {
          return raw.request({ method, params });
        }
        throw new Error("Apollo Wallet does not support adding chains");
      }
      default: {
        if (typeof raw.request === "function") {
          return raw.request({ method, params });
        }
        if (typeof raw._request === "function") {
          return raw._request({ method, params });
        }
        throw new Error(`Unsupported method on Apollo Wallet adapter: ${method}`);
      }
    }

    return result;
  };

  return {
    ...raw,
    request,
    on,
    removeListener,
    emit,
  };
}

function pickBestProvider(candidates: any[]) {
  const valid = candidates.filter(Boolean).filter(looksLikeProvider);
  if (valid.length === 0) return undefined;

  const apolloLike = valid.find(isApolloLikeProvider);
  if (apolloLike) return apolloLike;

  const withRequest = valid.find((provider) => typeof provider.request === "function");
  if (withRequest) return withRequest;

  return valid[0];
}

function findRawApolloProvider() {
  if (typeof window === "undefined") return undefined;

  const win = window as any;
  const apollo = win.apollo;
  const apolloWallet = win.apolloWallet;
  const muses = win.muses;

  const fromInjected = collectInjectedProviders(win).find(isApolloLikeProvider);

  const candidates = [
    eip6963ApolloProvider,
    apolloWallet?.ethereum,
    apolloWallet?.provider,
    apolloWallet,
    apollo?.ethereum,
    apollo?.evm,
    apollo?.provider,
    apollo?.ethereumProvider,
    apollo?.providers?.ethereum,
    apollo?.providers?.evm,
    apollo?.wallet,
    apollo,
    muses?.ethereum,
    muses?.evm,
    muses?.provider,
    muses?.ethereumProvider,
    muses?.providers?.ethereum,
    muses?.providers?.evm,
    muses?.wallet,
    muses,
    fromInjected,
    isApolloLikeProvider(win.ethereum) ? win.ethereum : undefined,
  ];

  return pickBestProvider(candidates);
}

export function getApolloWalletProvider() {
  requestApolloWalletProviders();
  return wrapProvider(findRawApolloProvider());
}

export function isApolloWalletInstalled() {
  return typeof window !== "undefined" && !!findRawApolloProvider();
}

export async function waitForApolloWalletProvider(timeoutMs = 6000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const provider = getApolloWalletProvider();
    if (provider) return provider;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return undefined;
}
