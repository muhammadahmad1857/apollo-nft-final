/* eslint-disable @typescript-eslint/no-explicit-any */

import { apolloMainnet } from "./apollo-chain";

const APOLLO_CHAIN_HEX = `0x${apolloMainnet.id.toString(16)}`;
const APOLLO_WRAPPED = Symbol.for("apollo.wallet.wrapped");
const MAX_DEBUG_LOGS = 150;
const CONNECT_ACCOUNTS_TIMEOUT_MS = 60_000;

/** Canonical brand icon — same in Popular (not installed) and after EIP-6963 discovery. */
export const APOLLO_WALLET_BRAND_ICON = "/icons/apollo-wallet.png";

type ApolloDebugLogLevel = "info" | "warn" | "error";

export type ApolloWalletDebugLog = {
  ts: string;
  level: ApolloDebugLogLevel;
  message: string;
  data?: unknown;
};

const debugLogs: ApolloWalletDebugLog[] = [];
const debugSubscribers = new Set<() => void>();

function isDebugPanelOpen() {
  return (
    typeof window !== "undefined" &&
    window.location.search.includes("showProviders=1")
  );
}

export function pushApolloWalletDebugLog(
  message: string,
  data?: unknown,
  level: ApolloDebugLogLevel = "info"
) {
  const entry: ApolloWalletDebugLog = {
    ts: new Date().toISOString(),
    level,
    message,
    data,
  };
  debugLogs.unshift(entry);
  if (debugLogs.length > MAX_DEBUG_LOGS) debugLogs.pop();
  debugSubscribers.forEach((fn) => fn());

  if (isDebugPanelOpen()) {
    const prefix = `[apollo-wallet:${level}]`;
    if (data !== undefined) console.log(prefix, message, data);
    else console.log(prefix, message);
  }
}

export function getApolloWalletDebugLogs() {
  return [...debugLogs];
}

export function subscribeApolloWalletDebugLogs(cb: () => void) {
  debugSubscribers.add(cb);
  return () => debugSubscribers.delete(cb);
}

export function clearApolloWalletDebugLogs() {
  debugLogs.length = 0;
  debugSubscribers.forEach((fn) => fn());
}

export function getApolloWalletDebugState() {
  return {
    rdns: getApolloWalletRdns(),
    name: getApolloWalletName(),
    icon: getApolloWalletIcon(),
    installed: isApolloWalletInstalled(),
    providerWrapped: Boolean(eip6963ApolloProvider && isWrapped(eip6963ApolloProvider)),
    expectedChainHex: APOLLO_CHAIN_HEX,
  };
}

export const APOLLO_WALLET_CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/apollo-wallet/mnpnahmgchhkjphkkemhbnjedajbcbll";

export const APOLLO_WALLET_WEBSITE_URL = "https://apollowallet.io";

const APOLLO_PROVIDER_FLAGS = [
  "isApolloWallet",
  "isApollo",
  "isMuses",
  "isMusesWallet",
  "isMusesProvider",
] as const;

let eip6963ApolloProvider: any;
let eip6963ApolloRdns: string | undefined;
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
  if (info?.name) eip6963ApolloName = info.name;
}

function isWrapped(provider: any) {
  return Boolean(provider?.[APOLLO_WRAPPED]);
}

function normalizeAccounts(value: any) {
  if (value == null) return [];
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

const APOLLO_RAW_PROVIDER = Symbol.for("apollo.wallet.raw");

function getUnwrappedProvider(provider: any) {
  return provider?.[APOLLO_RAW_PROVIDER] ?? provider;
}

function isEthAddress(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function filterEvmAccounts(value: any) {
  return normalizeAccounts(value).filter(isEthAddress);
}

function waitForNonEmptyAccountsChanged(raw: any, timeoutMs: number) {
  return new Promise<string[]>((resolve, reject) => {
    if (typeof raw.on !== "function") {
      reject(new Error("Apollo Wallet does not emit accountsChanged"));
      return;
    }

    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      if (typeof raw.removeListener === "function") {
        raw.removeListener("accountsChanged", onAccountsChanged);
      }
    };

    const onAccountsChanged = (accounts: unknown) => {
      const evm = filterEvmAccounts(accounts);
      if (!evm.length) return;
      if (settled) return;
      settled = true;
      cleanup();
      pushApolloWalletDebugLog("connect resolved via accountsChanged", { accounts: evm });
      resolve(evm);
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Apollo Wallet connection timed out waiting for account approval."));
    }, timeoutMs);

    raw.on("accountsChanged", onAccountsChanged);
  });
}

/**
 * Apollo/Muses wallets often resolve connect() or requestAccounts() while
 * eth_requestAccounts hangs until the user approves in the extension popup.
 */
async function requestAccountsFromProvider(raw: any, params?: any[]) {
  const accountsChangedPromise = waitForNonEmptyAccountsChanged(raw, CONNECT_ACCOUNTS_TIMEOUT_MS);

  const promptPromise = (async () => {
    if (typeof raw.connect === "function") {
      const accounts = filterEvmAccounts(await raw.connect());
      if (accounts.length) {
        pushApolloWalletDebugLog("connect() returned accounts", { accounts });
        return accounts;
      }
    }

    if (typeof raw.requestAccounts === "function") {
      const accounts = filterEvmAccounts(await raw.requestAccounts());
      if (accounts.length) {
        pushApolloWalletDebugLog("requestAccounts() returned accounts", { accounts });
        return accounts;
      }
    }

    if (typeof raw.enable === "function") {
      const accounts = filterEvmAccounts(await raw.enable());
      if (accounts.length) return accounts;
    }

    if (typeof raw.request === "function") {
      const accounts = filterEvmAccounts(
        await raw.request({ method: "eth_requestAccounts", params })
      );
      if (accounts.length) {
        pushApolloWalletDebugLog("eth_requestAccounts returned accounts", { accounts });
        return accounts;
      }
    }

    throw new Error("Apollo Wallet returned no accounts. Approve the connection in the extension.");
  })();

  try {
    return await Promise.race([accountsChangedPromise, promptPromise]);
  } catch (err) {
    const settled = await Promise.allSettled([accountsChangedPromise, promptPromise]);
    for (const result of settled) {
      if (result.status === "fulfilled" && result.value.length > 0) {
        return result.value;
      }
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Minimal adapter: passthrough RPC to the extension, but suppress spurious
 * accountsChanged([]) before the first successful connect. Apollo emits empty
 * accounts during handshake which makes wagmi call onDisconnect and abort connect.
 */
function wrapProvider(raw: any) {
  if (!raw) return undefined;
  if (isWrapped(raw)) return raw;

  let hasConnectedAccounts = false;
  let connectInProgress = false;
  const listenerMap = new Map<string, Map<(...args: any[]) => void, (...args: any[]) => void>>();

  const notifyConnected = async (accounts: string[]) => {
    if (!accounts.length || typeof raw.request !== "function") return;
    const chainId = await raw.request({ method: "eth_chainId" });
    if (typeof raw.emit === "function") {
      raw.emit("accountsChanged", accounts);
      raw.emit("connect", { chainId });
    }
  };

  const request = async ({ method, params }: { method: string; params?: any[] }) => {
    pushApolloWalletDebugLog(`RPC → ${method}`, { params });

    if (method === "eth_requestAccounts") connectInProgress = true;

    try {
      if (method === "eth_requestAccounts") {
        const accounts = await requestAccountsFromProvider(raw, params);
        pushApolloWalletDebugLog(`RPC ← ${method}`, { result: accounts });
        if (accounts.length > 0) {
          hasConnectedAccounts = true;
          await notifyConnected(accounts);
        }
        return accounts;
      }

      if (typeof raw.request !== "function") {
        throw new Error(`Apollo Wallet does not support ${method}`);
      }

      const result = await raw.request({ method, params });
      pushApolloWalletDebugLog(`RPC ← ${method}`, { result });
      return result;
    } catch (err) {
      pushApolloWalletDebugLog(
        `RPC ✗ ${method}`,
        { error: err instanceof Error ? err.message : String(err) },
        "error"
      );
      throw err;
    } finally {
      if (method === "eth_requestAccounts") connectInProgress = false;
    }
  };

  const on = (event: string, listener: (...args: any[]) => void) => {
    if (typeof raw.on !== "function") return;

    const wrappedListener =
      event === "accountsChanged"
        ? (accounts: unknown) => {
            const normalized = normalizeAccounts(accounts);
            if (normalized.length === 0) {
              if (connectInProgress || !hasConnectedAccounts) {
                pushApolloWalletDebugLog(
                  "ignored empty accountsChanged during connect handshake",
                  { connectInProgress, hasConnectedAccounts },
                  "warn"
                );
                return;
              }
            } else {
              hasConnectedAccounts = true;
            }
            pushApolloWalletDebugLog(`provider event: accountsChanged`, normalized);
            listener(accounts);
          }
        : (...args: any[]) => {
            pushApolloWalletDebugLog(`provider event: ${event}`, args);
            listener(...args);
          };

    if (!listenerMap.has(event)) listenerMap.set(event, new Map());
    listenerMap.get(event)!.set(listener, wrappedListener);
    raw.on(event, wrappedListener);
  };

  const removeListener = (event: string, listener: (...args: any[]) => void) => {
    const wrapped = listenerMap.get(event)?.get(listener);
    if (wrapped && typeof raw.removeListener === "function") {
      raw.removeListener(event, wrapped);
    }
    listenerMap.get(event)?.delete(listener);
  };

  return {
    ...raw,
    request,
    on,
    removeListener,
    [APOLLO_WRAPPED]: true,
    [APOLLO_RAW_PROVIDER]: raw,
  };
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "eip6963:announceProvider",
    (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.provider || !isApolloAnnouncement(detail.info)) return;

      // Use brand icon everywhere (Installed + Popular) for consistent UI.
      if (detail.info) detail.info.icon = APOLLO_WALLET_BRAND_ICON;

      detail.provider = wrapProvider(detail.provider);
      rememberAnnouncement(detail.info, detail.provider);
      pushApolloWalletDebugLog("EIP-6963 Apollo provider announced", {
        rdns: detail.info?.rdns,
        name: detail.info?.name,
        uuid: detail.info?.uuid,
      });
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

export function getApolloWalletIcon() {
  return APOLLO_WALLET_BRAND_ICON;
}

export function getApolloWalletName() {
  return eip6963ApolloName ?? "Apollo Wallet";
}

function findFlaggedInjectedApolloProvider() {
  if (typeof window === "undefined") return undefined;

  const win = window as any;
  const providers = [win.ethereum, ...(Array.isArray(win.ethereum?.providers) ? win.ethereum.providers : [])]
    .filter(Boolean);

  return providers.find(
    (provider) =>
      looksLikeProvider(provider) &&
      APOLLO_PROVIDER_FLAGS.some((flag) => Boolean(provider[flag]))
  );
}

function findRawApolloProvider() {
  if (typeof window === "undefined") return undefined;

  if (eip6963ApolloProvider) {
    return getUnwrappedProvider(eip6963ApolloProvider);
  }

  const flagged = findFlaggedInjectedApolloProvider();
  if (flagged) return flagged;

  const win = window as any;
  const apolloWallet = win.apolloWallet;

  const candidates = [
    apolloWallet?.ethereum,
    apolloWallet?.provider,
    apolloWallet?.evm,
    win.apollo?.ethereum,
    win.apollo?.evm,
    win.apollo?.provider,
    win.muses?.ethereum,
    win.muses?.evm,
    win.muses?.provider,
  ].filter(Boolean);

  return candidates.find(
    (provider) =>
      looksLikeProvider(provider) &&
      APOLLO_PROVIDER_FLAGS.some((flag) => Boolean(provider[flag]))
  );
}

export function isApolloWalletInstalled() {
  if (typeof window === "undefined") return false;
  if (eip6963ApolloProvider) return true;
  return Boolean(findFlaggedInjectedApolloProvider());
}

export function getApolloWalletProvider() {
  if (typeof window === "undefined") return undefined;

  requestApolloWalletProviders();
  const provider = findRawApolloProvider();
  return provider ? wrapProvider(provider) : undefined;
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
