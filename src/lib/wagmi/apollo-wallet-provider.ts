/* eslint-disable @typescript-eslint/no-explicit-any */

import { apolloMainnet } from "./apollo-chain";

const APOLLO_CHAIN_HEX = `0x${apolloMainnet.id.toString(16)}`;
const APOLLO_WRAPPED = Symbol.for("apollo.wallet.wrapped");
const APOLLO_RAW_PROVIDER = Symbol.for("apollo.wallet.raw");
const wrappedProviderCache = new WeakMap<object, any>();
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
  const sdk = getApolloWalletSdk();
  const provider = resolveApolloConnectProvider();
  return {
    rdns: getApolloWalletRdns(),
    name: getApolloWalletName(),
    icon: getApolloWalletIcon(),
    installed: isApolloWalletInstalled(),
    providerWrapped: Boolean(eip6963ApolloProvider && isWrapped(eip6963ApolloProvider)),
    expectedChainHex: APOLLO_CHAIN_HEX,
    sdk: sdk
      ? {
          keys: Object.keys(sdk).slice(0, 24),
          hasConnect: typeof sdk.connect === "function",
          hasRequestAccounts: typeof sdk.requestAccounts === "function",
        }
      : null,
    connectProviderSource: describeProviderSource(provider),
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
let eip6963InjectProvider: any;
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

function getUnwrappedProvider(provider: any) {
  return provider?.[APOLLO_RAW_PROVIDER] ?? provider;
}

function normalizeAccounts(value: any) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) return [value];
  if (value && Array.isArray(value.accounts)) return value.accounts;
  if (value && typeof value === "object" && typeof value.address === "string") {
    return [value.address];
  }
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

function isEthAddress(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function filterEvmAccounts(value: any) {
  return normalizeAccounts(value).filter(isEthAddress);
}

/** window.apolloWallet SDK — inject.js logs show this is separate from the passive inject RPC stub. */
export function getApolloWalletSdk() {
  if (typeof window === "undefined") return undefined;
  const win = window as any;
  return win.apolloWallet ?? win.apollo ?? win.muses;
}

function describeProviderSource(provider: any) {
  if (!provider || typeof window === "undefined") return "none";
  const win = window as any;
  const sdk = getApolloWalletSdk();
  if (provider === sdk) return "window.apolloWallet (sdk)";
  if (provider === sdk?.ethereum) return "window.apolloWallet.ethereum";
  if (provider === sdk?.provider) return "window.apolloWallet.provider";
  if (provider === sdk?.evm) return "window.apolloWallet.evm";
  if (provider === eip6963InjectProvider) return "eip6963 inject stub";
  if (provider === win.ethereum) return "window.ethereum";
  return "other";
}

/**
 * The EIP-6963 / window.ethereum inject handles read-only RPC (chainId, eth_accounts)
 * but Apollo opens the approval UI via window.apolloWallet.connect().
 */
export function resolveApolloConnectProvider() {
  if (typeof window === "undefined") return undefined;

  const sdk = getApolloWalletSdk();
  if (sdk) {
    const sdkCandidates = [sdk.ethereum, sdk.provider, sdk.evm, sdk].filter(Boolean);
    const sdkProvider = sdkCandidates.find(looksLikeProvider);
    if (sdkProvider) return sdkProvider;
  }

  if (eip6963InjectProvider && looksLikeProvider(eip6963InjectProvider)) {
    return eip6963InjectProvider;
  }

  if (eip6963ApolloProvider) {
    return getUnwrappedProvider(eip6963ApolloProvider);
  }

  return findFlaggedInjectedApolloProvider();
}

async function trySdkMethod(label: string, fn: () => Promise<unknown>) {
  try {
    pushApolloWalletDebugLog(`SDK → ${label}`);
    const result = await fn();
    const accounts = filterEvmAccounts(result);
    pushApolloWalletDebugLog(`SDK ← ${label}`, { result, accounts });
    return accounts;
  } catch (err) {
    pushApolloWalletDebugLog(
      `SDK ✗ ${label}`,
      { error: err instanceof Error ? err.message : String(err) },
      "warn"
    );
    return [];
  }
}

/**
 * Opens the Apollo approval popup via the SDK — NOT via eth_requestAccounts on the inject stub.
 */
async function requestAccountsViaApolloSdk() {
  const sdk = getApolloWalletSdk();
  if (!sdk || typeof sdk !== "object") return [];

  pushApolloWalletDebugLog("requestAccountsViaApolloSdk", {
    keys: Object.keys(sdk).slice(0, 24),
    hasConnect: typeof sdk.connect === "function",
    hasRequestAccounts: typeof sdk.requestAccounts === "function",
    hasEnable: typeof sdk.enable === "function",
  });

  if (typeof sdk.connect === "function") {
    const accounts = await trySdkMethod("apolloWallet.connect()", () => sdk.connect());
    if (accounts.length) return accounts;

    const withChain = await trySdkMethod("apolloWallet.connect({ chainId })", () =>
      sdk.connect({ chainId: apolloMainnet.id })
    );
    if (withChain.length) return withChain;
  }

  if (typeof sdk.requestAccounts === "function") {
    const accounts = await trySdkMethod("apolloWallet.requestAccounts()", () =>
      sdk.requestAccounts()
    );
    if (accounts.length) return accounts;
  }

  if (typeof sdk.enable === "function") {
    const accounts = await trySdkMethod("apolloWallet.enable()", () => sdk.enable());
    if (accounts.length) return accounts;
  }

  if (typeof sdk.openConnectModal === "function") {
    await trySdkMethod("apolloWallet.openConnectModal()", () => sdk.openConnectModal());
  }

  return [];
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

async function requestAccountsFromProvider(raw: any, params?: any[]) {
  const eventTargets = [raw, getApolloWalletSdk()].filter(Boolean);
  const accountsChangedPromise = Promise.race(
    eventTargets.map((target) => waitForNonEmptyAccountsChanged(target, CONNECT_ACCOUNTS_TIMEOUT_MS))
  );

  const promptPromise = (async () => {
    // 1. SDK popup path — must run before eth_requestAccounts on inject stub
    const sdkAccounts = await requestAccountsViaApolloSdk();
    if (sdkAccounts.length) return sdkAccounts;

    // 2. Provider-native methods on the connect provider (not inject stub)
    if (typeof raw.connect === "function") {
      const accounts = filterEvmAccounts(await raw.connect());
      if (accounts.length) {
        pushApolloWalletDebugLog("provider.connect() returned accounts", { accounts });
        return accounts;
      }
    }

    if (typeof raw.requestAccounts === "function") {
      const accounts = filterEvmAccounts(await raw.requestAccounts());
      if (accounts.length) {
        pushApolloWalletDebugLog("provider.requestAccounts() returned accounts", { accounts });
        return accounts;
      }
    }

    if (typeof raw.enable === "function") {
      const accounts = filterEvmAccounts(await raw.enable());
      if (accounts.length) return accounts;
    }

    // 3. Last resort — eth_requestAccounts on inject (does NOT open popup on Apollo)
    if (typeof raw.request === "function") {
      pushApolloWalletDebugLog(
        "fallback eth_requestAccounts on inject provider (may not open popup)",
        undefined,
        "warn"
      );
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

function wrapProvider(raw: any) {
  if (!raw) return undefined;
  if (isWrapped(raw)) return raw;

  const cached = wrappedProviderCache.get(raw);
  if (cached) return cached;

  let hasConnectedAccounts = false;
  let connectInProgress = false;
  const listenerMap = new Map<string, Map<(...args: any[]) => void, (...args: any[]) => void>>();

  const resetConnectionState = (reason: string) => {
    hasConnectedAccounts = false;
    connectInProgress = false;
    pushApolloWalletDebugLog(`connection state reset (${reason})`);
  };

  if (typeof raw.on === "function") {
    raw.on("disconnect", () => resetConnectionState("provider disconnect event"));
  }

  const request = async ({ method, params }: { method: string; params?: any[] }) => {
    pushApolloWalletDebugLog(`RPC → ${method}`, { params, source: describeProviderSource(raw) });

    if (method === "eth_requestAccounts") connectInProgress = true;

    try {
      if (method === "eth_requestAccounts") {
        const accounts = await requestAccountsFromProvider(raw, params);
        pushApolloWalletDebugLog(`RPC ← ${method}`, { result: accounts });
        if (accounts.length > 0) hasConnectedAccounts = true;
        return accounts;
      }

      if (method === "wallet_revokePermissions") {
        resetConnectionState("wallet_revokePermissions");
        const sdk = getApolloWalletSdk();
        try {
          if (typeof sdk?.disconnect === "function") {
            await sdk.disconnect();
          }
        } catch {
          // Best-effort SDK disconnect for EIP-6963 / Installed path.
        }
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
              if (connectInProgress) {
                pushApolloWalletDebugLog(
                  "ignored empty accountsChanged during connect handshake",
                  { connectInProgress, hasConnectedAccounts },
                  "warn"
                );
                return;
              }
              if (hasConnectedAccounts) {
                resetConnectionState("accountsChanged empty (disconnect)");
                pushApolloWalletDebugLog(`provider event: accountsChanged`, normalized);
                listener(accounts);
                return;
              }
              pushApolloWalletDebugLog(
                "ignored empty accountsChanged before first connect",
                undefined,
                "warn"
              );
              return;
            }

            hasConnectedAccounts = true;
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

  const wrapped = {
    ...raw,
    request,
    on,
    removeListener,
    [APOLLO_WRAPPED]: true,
    [APOLLO_RAW_PROVIDER]: raw,
  };

  wrappedProviderCache.set(raw, wrapped);
  return wrapped;
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "eip6963:announceProvider",
    (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.provider || !isApolloAnnouncement(detail.info)) return;

      eip6963InjectProvider = detail.provider;

      if (detail.info) detail.info.icon = APOLLO_WALLET_BRAND_ICON;

      const connectProvider = resolveApolloConnectProvider() ?? detail.provider;
      pushApolloWalletDebugLog("EIP-6963 Apollo announced — routing connect provider", {
        rdns: detail.info?.rdns,
        injectSource: describeProviderSource(detail.provider),
        connectSource: describeProviderSource(connectProvider),
      });

      detail.provider = wrapProvider(connectProvider);
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

export function isApolloWalletInstalled() {
  if (typeof window === "undefined") return false;
  if (getApolloWalletSdk()) return true;
  if (eip6963ApolloProvider || eip6963InjectProvider) return true;
  return Boolean(findFlaggedInjectedApolloProvider());
}

export function getApolloWalletProvider() {
  if (typeof window === "undefined") return undefined;

  requestApolloWalletProviders();
  const provider = resolveApolloConnectProvider();
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
