/* eslint-disable @typescript-eslint/no-explicit-any */

import { apolloMainnet } from "./apollo-chain";

const APOLLO_CHAIN_HEX = `0x${apolloMainnet.id.toString(16)}`;
const ACCOUNTS_CHANGED_TIMEOUT_MS = 15_000;
const APOLLO_WRAPPED = Symbol.for("apollo.wallet.wrapped");

export const APOLLO_WALLET_CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/apollo-wallet/mnpnahmgchhkjphkkemhbnjedajbcbll";

const APOLLO_PROVIDER_FLAGS = [
  "isApolloWallet",
  "isApollo",
  "isMuses",
  "isMusesWallet",
  "isMusesProvider",
] as const;

/** Fallback golden mark until EIP-6963 icon arrives from the extension */
const APOLLO_ICON_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='24' fill='%231a1408'/%3E%3Ccircle cx='48' cy='48' r='28' fill='none' stroke='%23d4af37' stroke-width='4'/%3E%3Cpath d='M48 28 L62 52 L54 52 L58 68 L48 58 L38 68 L42 52 L34 52 Z' fill='%23d4af37'/%3E%3C/svg%3E";

let eip6963ApolloProvider: any;
let eip6963ApolloRdns: string | undefined;
let eip6963ApolloIcon: string | undefined;
let eip6963ApolloName: string | undefined;

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
  if (info?.icon) eip6963ApolloIcon = info.icon;
  if (info?.name) eip6963ApolloName = info.name;
}

function isWrapped(provider: any) {
  return Boolean(provider?.[APOLLO_WRAPPED]);
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "eip6963:announceProvider",
    (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.provider || !isApolloAnnouncement(detail.info)) return;

      detail.provider = wrapProvider(detail.provider);
      rememberAnnouncement(detail.info, detail.provider);
    },
    true
  );
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function requestApolloWalletProviders() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function initApolloWalletDiscovery() {
  if (typeof window === "undefined") return () => undefined;
  requestApolloWalletProviders();
  return () => undefined;
}

export function getApolloWalletRdns() {
  return eip6963ApolloRdns ?? "io.apollowallet";
}

/** Golden logo from the extension's EIP-6963 announcement (data URL). */
export function getApolloWalletIcon() {
  return eip6963ApolloIcon ?? APOLLO_ICON_FALLBACK;
}

export function getApolloWalletName() {
  return eip6963ApolloName ?? "Apollo Wallet";
}

function toHexChainId(chainId: any) {
  if (typeof chainId === "string") {
    if (chainId.startsWith("0x")) return chainId;
    if (/apollo|mainnet/i.test(chainId)) return APOLLO_CHAIN_HEX;
    const asNum = Number(chainId);
    if (!Number.isNaN(asNum)) return `0x${asNum.toString(16)}`;
    throw new Error(`Apollo Wallet returned an invalid chainId: ${chainId}`);
  }
  if (typeof chainId === "number") return `0x${chainId.toString(16)}`;
  throw new Error(`Apollo Wallet returned an invalid chainId: ${String(chainId)}`);
}

function normalizeAccounts(value: any) {
  if (value == null) return [];
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

async function resolveChainId(raw: any) {
  if (typeof raw.request === "function") {
    const chainId = await raw.request({ method: "eth_chainId" });
    if (chainId != null && chainId !== "") return toHexChainId(chainId);
  }
  if (typeof raw.getChain === "function") return toHexChainId(await raw.getChain());
  if (typeof raw.getNetwork === "function") return toHexChainId(await raw.getNetwork());
  if (typeof raw.getChainId === "function") return toHexChainId(await raw.getChainId());
  throw new Error("Apollo Wallet did not return a chainId");
}

async function requestPermissions(raw: any) {
  if (typeof raw.request !== "function") return;
  try {
    await raw.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch {
    // Already authorized or wallet does not support permissions RPC
  }
}

async function promptForAccounts(raw: any) {
  if (typeof raw.requestAccounts === "function") {
    return normalizeAccounts(await raw.requestAccounts());
  }
  if (typeof raw.connect === "function") {
    return normalizeAccounts(await raw.connect());
  }
  if (typeof raw.request === "function") {
    return normalizeAccounts(await raw.request({ method: "eth_requestAccounts" }));
  }
  if (typeof raw.getAccounts === "function") {
    return normalizeAccounts(await raw.getAccounts());
  }
  return [];
}

function pickEvmAccounts(rawAccounts: unknown[]) {
  const accounts = normalizeAccounts(rawAccounts);
  const evmAccounts = accounts.filter(isEthAddress);

  if (evmAccounts.length > 0) return evmAccounts;

  if (accounts.length > 0) {
    throw new Error(
      "Apollo Wallet returned a non-EVM account. Enable EVM / Apollo Mainnet in the wallet, then try again."
    );
  }

  throw new Error("Apollo Wallet returned no accounts. Approve the connection in the extension.");
}

async function waitForAccountsChanged(raw: any, timeoutMs: number) {
  return new Promise<string[]>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      if (typeof raw.removeListener === "function") {
        raw.removeListener("accountsChanged", onAccountsChanged);
      }
    };

    const finish = (accounts: unknown[]) => {
      if (settled) return;
      try {
        const evmAccounts = pickEvmAccounts(accounts);
        settled = true;
        cleanup();
        resolve(evmAccounts);
      } catch (err) {
        settled = true;
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    const onAccountsChanged = (accounts: unknown) => {
      finish(normalizeAccounts(accounts));
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(
        new Error(
          "Apollo Wallet connection timed out. Open the extension popup and approve the connection."
        )
      );
    }, timeoutMs);

    if (typeof raw.on !== "function") {
      settled = true;
      cleanup();
      reject(new Error("Apollo Wallet returned no accounts. Approve the connection in the extension."));
      return;
    }

    raw.on("accountsChanged", onAccountsChanged);
  });
}

async function requestEvmAccounts(raw: any) {
  await requestPermissions(raw);

  try {
    const immediate = pickEvmAccounts(await promptForAccounts(raw));
    return immediate;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("no accounts")) throw err;
  }

  return waitForAccountsChanged(raw, ACCOUNTS_CHANGED_TIMEOUT_MS);
}

function wrapProvider(raw: any) {
  if (!raw) return undefined;
  if (isWrapped(raw)) return raw;

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

  if (typeof raw.on === "function") {
    for (const event of ["accountsChanged", "chainChanged", "connect", "disconnect"] as const) {
      raw.on(event, (...args: any[]) => emit(event, ...args));
    }
  }

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
        result = await requestEvmAccounts(raw);
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

  const wrapped = {
    ...raw,
    request,
    on,
    removeListener,
    emit,
    [APOLLO_WRAPPED]: true,
  };

  return wrapped;
}

function findRawApolloProvider() {
  if (typeof window === "undefined") return undefined;

  const win = window as any;
  const apollo = win.apollo;
  const apolloWallet = win.apolloWallet;
  const muses = win.muses;

  const injectedApollo = [win.ethereum, ...(Array.isArray(win.ethereum?.providers) ? win.ethereum.providers : [])]
    .filter(Boolean)
    .find(isApolloLikeProvider);

  const candidates = [
    eip6963ApolloProvider,
    injectedApollo,
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
  ].filter(Boolean);

  if (eip6963ApolloProvider && looksLikeProvider(eip6963ApolloProvider)) {
    return eip6963ApolloProvider;
  }

  return candidates.find((provider) => looksLikeProvider(provider) && isApolloLikeProvider(provider));
}

export function getApolloWalletProvider() {
  if (typeof window === "undefined") return undefined;

  requestApolloWalletProviders();
  const provider = findRawApolloProvider();
  return provider ? wrapProvider(provider) : undefined;
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
