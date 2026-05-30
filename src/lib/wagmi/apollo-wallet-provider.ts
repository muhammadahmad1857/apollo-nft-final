/* eslint-disable @typescript-eslint/no-explicit-any */

import { apolloMainnet } from "./apollo-chain";

const APOLLO_CHAIN_HEX = `0x${apolloMainnet.id.toString(16)}`;
const APOLLO_WRAPPED = Symbol.for("apollo.wallet.wrapped");
const APOLLO_RAW_PROVIDER = Symbol.for("apollo.wallet.raw");
const wrappedProviderCache = new WeakMap<object, any>();
const MAX_DEBUG_LOGS = 150;
const CONNECT_ACCOUNTS_TIMEOUT_MS = 60_000;
const LOG_PREFIX = "[Apollo Wallet]";

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

/** Always logs to console so you can debug without ?showProviders=1 */
function logApollo(level: ApolloDebugLogLevel, message: string, data?: unknown) {
  const entry: ApolloWalletDebugLog = {
    ts: new Date().toISOString(),
    level,
    message,
    data,
  };
  debugLogs.unshift(entry);
  if (debugLogs.length > MAX_DEBUG_LOGS) debugLogs.pop();
  debugSubscribers.forEach((fn) => fn());

  const line = data !== undefined ? `${LOG_PREFIX} ${message}` : `${LOG_PREFIX} ${message}`;
  if (level === "error") console.error(line, data ?? "");
  else if (level === "warn") console.warn(line, data ?? "");
  else console.info(line, data ?? "");
}

export function pushApolloWalletDebugLog(
  message: string,
  data?: unknown,
  level: ApolloDebugLogLevel = "info"
) {
  logApollo(level, message, data);
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
    sdk: inspectApolloSdk(sdk),
    connectProviderSource: describeProviderSource(provider),
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
let eip6963InjectProvider: any;
let eip6963ApolloRdns: string | undefined;
let eip6963ApolloName: string | undefined;
let eip6963LoggedRdns: string | undefined;

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

/** Apollo exposes request() on the prototype — Object.keys misses it. */
function inspectApolloProvider(obj: any) {
  if (!obj || typeof obj !== "object") return null;

  const ownKeys = Object.getOwnPropertyNames(obj);
  let protoMethods: string[] = [];
  try {
    const proto = Object.getPrototypeOf(obj);
    if (proto) {
      protoMethods = Object.getOwnPropertyNames(proto).filter(
        (k) => k !== "constructor" && typeof proto[k] === "function"
      );
    }
  } catch {
    // ignore
  }

  return {
    ownKeys,
    protoMethods,
    hasRequest: typeof obj.request === "function",
    hasConnect: typeof obj.connect === "function",
    selectedAddress: obj.selectedAddress ?? null,
    activeAddress: obj.activeAddress ?? null,
    connected: obj.connected ?? null,
    chainId: obj.chainId ?? null,
  };
}

function getRawApolloProvider() {
  return eip6963InjectProvider ?? getApolloWalletSdk();
}

function readAddressesFromProviderState(provider: any) {
  const sdk = getApolloWalletSdk();
  return filterEvmAccounts([
    provider?.selectedAddress,
    provider?.activeAddress,
    sdk?.selectedAddress,
    sdk?.activeAddress,
  ]);
}

function isEthAddress(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function filterEvmAccounts(value: any) {
  return normalizeAccounts(value).filter(isEthAddress);
}

export function getApolloWalletSdk() {
  if (typeof window === "undefined") return undefined;
  const win = window as any;
  return win.apolloWallet ?? win.apollo ?? win.muses;
}

function inspectApolloSdk(sdk: any) {
  return inspectApolloProvider(sdk);
}

function describeProviderSource(provider: any) {
  if (!provider || typeof window === "undefined") return "none";
  const win = window as any;
  const sdk = getApolloWalletSdk();
  if (provider === sdk) return "window.apolloWallet (sdk root)";
  if (provider === sdk?.ethereum) return "window.apolloWallet.ethereum (= inject stub if same as window.ethereum)";
  if (provider === sdk?.provider) return "window.apolloWallet.provider";
  if (provider === sdk?.evm) return "window.apolloWallet.evm";
  if (provider === eip6963InjectProvider) return "eip6963 inject stub";
  if (provider === win.ethereum) return "window.ethereum";
  return "other";
}

function isInjectStub(provider: any) {
  if (typeof window === "undefined") return false;
  const win = window as any;
  return provider === win.ethereum || provider === eip6963InjectProvider;
}

export function resolveApolloConnectProvider() {
  if (typeof window === "undefined") return undefined;
  const sdk = getApolloWalletSdk();
  if (sdk) {
    const sdkCandidates = [sdk, sdk.provider, sdk.evm, sdk.ethereum].filter(Boolean);
    const sdkProvider = sdkCandidates.find(looksLikeProvider);
    if (sdkProvider) return sdkProvider;
  }
  if (eip6963InjectProvider && looksLikeProvider(eip6963InjectProvider)) {
    return eip6963InjectProvider;
  }
  if (eip6963ApolloProvider) return getUnwrappedProvider(eip6963ApolloProvider);
  return findFlaggedInjectedApolloProvider();
}

type ConnectAttempt = { label: string; run: () => Promise<unknown> };

function buildConnectAttempts(sdk: any): ConnectAttempt[] {
  const attempts: ConnectAttempt[] = [];
  const add = (label: string, run: () => Promise<unknown>) => attempts.push({ label, run });

  if (typeof sdk.connect === "function") {
    add("apolloWallet.connect()", () => sdk.connect());
    add("apolloWallet.connect({ chainId: 62606 })", () => sdk.connect({ chainId: apolloMainnet.id }));
    add("apolloWallet.connect({ chainId: '0xf48e' })", () => sdk.connect({ chainId: APOLLO_CHAIN_HEX }));
  }
  if (typeof sdk.requestAccounts === "function") {
    add("apolloWallet.requestAccounts()", () => sdk.requestAccounts());
  }
  if (typeof sdk.enable === "function") {
    add("apolloWallet.enable()", () => sdk.enable());
  }
  if (typeof sdk.openConnectModal === "function") {
    add("apolloWallet.openConnectModal()", () => sdk.openConnectModal());
  }
  if (typeof sdk.requestConnection === "function") {
    add("apolloWallet.requestConnection()", () => sdk.requestConnection());
  }

  for (const nestedKey of ["wallet", "evm", "ethereum", "provider"] as const) {
    const nested = sdk[nestedKey];
    if (!nested || typeof nested !== "object") continue;
    if (typeof nested.connect === "function") {
      add(`apolloWallet.${nestedKey}.connect()`, () => nested.connect());
    }
    if (typeof nested.requestAccounts === "function") {
      add(`apolloWallet.${nestedKey}.requestAccounts()`, () => nested.requestAccounts());
    }
  }

  return attempts;
}

function waitForNonEmptyAccountsChanged(target: any, timeoutMs: number, label: string) {
  return new Promise<string[]>((resolve, reject) => {
    if (typeof target?.on !== "function") {
      reject(new Error(`${label} does not support accountsChanged events`));
      return;
    }

    let settled = false;
    const cleanup = () => {
      window.clearTimeout(timer);
      if (typeof target.removeListener === "function") {
        target.removeListener("accountsChanged", onAccountsChanged);
      }
    };

    const onAccountsChanged = (accounts: unknown) => {
      const evm = filterEvmAccounts(accounts);
      if (!evm.length) return;
      if (settled) return;
      settled = true;
      cleanup();
      logApollo("info", `Got accounts from ${label}`, evm);
      resolve(evm);
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Timed out waiting for approval (${label})`));
    }, timeoutMs);

    target.on("accountsChanged", onAccountsChanged);
  });
}

/**
 * Apollo Wallet (io.zeusx.apollowallet) exposes window.apolloWallet as an EIP-1193
 * provider with request() on the prototype — NOT a separate connect() SDK.
 */
async function connectViaProviderRpc(raw: any): Promise<string[]> {
  if (typeof raw?.request !== "function") {
    throw new Error("Apollo provider has no request() method.");
  }

  logApollo("info", "Connect path: provider.request() → extension background/popup");
  logApollo("info", "Provider state before connect", inspectApolloProvider(raw));

  const accountsChangedPromise = waitForNonEmptyAccountsChanged(
    raw,
    CONNECT_ACCOUNTS_TIMEOUT_MS,
    "accountsChanged"
  ).catch(() => [] as string[]);

  const rpcPromise = (async () => {
    try {
      logApollo("info", "Step 1/2: wallet_requestPermissions (asks extension to allow this site)");
      await raw.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      logApollo("info", "Step 1/2: wallet_requestPermissions OK");
    } catch (err) {
      logApollo("warn", "Step 1/2: wallet_requestPermissions rejected — continuing anyway", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    logApollo("info", "Step 2/2: eth_requestAccounts (extension should open approval popup NOW)");
    const result = await raw.request({ method: "eth_requestAccounts" });
    logApollo("info", "Step 2/2: eth_requestAccounts response", { result });

    const accounts = filterEvmAccounts(result);
    if (accounts.length) return accounts;

    const fromState = readAddressesFromProviderState(raw);
    if (fromState.length) {
      logApollo("info", "Using selectedAddress/activeAddress from provider", fromState);
      return fromState;
    }

    throw new Error("No account returned — approve the connection in the Apollo Wallet extension popup.");
  })();

  const results = await Promise.allSettled([accountsChangedPromise, rpcPromise]);
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.length > 0) {
      return result.value;
    }
  }

  const rpcError = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
  throw rpcError?.reason instanceof Error
    ? rpcError.reason
    : new Error("Connection failed. Open Apollo Wallet extension, unlock it, then try again.");
}

export async function connectApolloWallet(): Promise<string[]> {
  logApollo("info", "─── CONNECT START ───");

  const sdk = getApolloWalletSdk();
  if (!sdk) {
    logApollo("error", "window.apolloWallet not found — install the extension.");
    throw new Error("Apollo Wallet extension not found.");
  }

  logApollo("info", "window.apolloWallet inspection", inspectApolloProvider(sdk));

  // Optional connect()/requestAccounts() for other Apollo builds
  const attempts = buildConnectAttempts(sdk);
  for (const { label, run } of attempts) {
    logApollo("info", `→ Trying ${label}`);
    try {
      const accounts = filterEvmAccounts(await run());
      if (accounts.length) {
        logApollo("info", `✓ SUCCESS via ${label}`, accounts);
        return accounts;
      }
    } catch (err) {
      logApollo("warn", `✗ ${label} failed`, { error: err instanceof Error ? err.message : String(err) });
    }
  }

  const raw = getRawApolloProvider();
  if (!raw) {
    throw new Error("Apollo provider not found.");
  }

  try {
    const accounts = await connectViaProviderRpc(getUnwrappedProvider(raw));
    logApollo("info", "─── CONNECT SUCCESS ───", accounts);
    return accounts;
  } catch (err) {
    logApollo("error", "─── CONNECT FAILED ───", {
      error: err instanceof Error ? err.message : String(err),
      hint:
        "If no popup appeared: unlock Apollo Wallet extension → click its icon → approve this site → retry.",
    });
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
    logApollo("info", `Session reset: ${reason}`);
  };

  if (typeof raw.on === "function") {
    raw.on("disconnect", () => resetConnectionState("extension disconnect event"));
  }

  const request = async ({ method, params }: { method: string; params?: any[] }) => {
    logApollo("info", `RPC request: ${method}`, {
      via: describeProviderSource(raw),
      isInjectStub: isInjectStub(raw),
    });

    if (method === "eth_requestAccounts") connectInProgress = true;

    try {
      if (method === "wallet_requestPermissions") {
        if (typeof raw.request !== "function") {
          return [{ caveats: [{ value: [] }] }];
        }
        logApollo("info", "Forwarding wallet_requestPermissions to extension");
        const result = await raw.request({ method, params });
        logApollo("info", "wallet_requestPermissions response", { result });
        return result;
      }

      if (method === "eth_requestAccounts") {
        logApollo("info", "Connect requested — running Apollo connect flow");
        const accounts = await connectApolloWallet();
        if (accounts.length > 0) hasConnectedAccounts = true;
        return accounts;
      }

      if (method === "wallet_revokePermissions") {
        resetConnectionState("wallet_revokePermissions");
        const sdk = getApolloWalletSdk();
        try {
          if (typeof sdk?.disconnect === "function") await sdk.disconnect();
        } catch {
          // best effort
        }
      }

      if (typeof raw.request !== "function") {
        throw new Error(`Apollo Wallet does not support ${method}`);
      }

      const result = await raw.request({ method, params });
      logApollo("info", `RPC response: ${method}`, { result });
      return result;
    } catch (err) {
      logApollo("error", `RPC failed: ${method}`, {
        error: err instanceof Error ? err.message : String(err),
      });
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
                logApollo("warn", "Ignored empty accountsChanged during connect (normal for Apollo inject)");
                return;
              }
              if (hasConnectedAccounts) {
                resetConnectionState("accountsChanged cleared");
                listener(accounts);
                return;
              }
              return;
            }
            hasConnectedAccounts = true;
            logApollo("info", "accountsChanged", normalized);
            listener(accounts);
          }
        : (...args: any[]) => {
            logApollo("info", `Event: ${event}`, args);
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

      const rdns = detail.info?.rdns ?? detail.info?.name;
      if (rdns !== eip6963LoggedRdns) {
        eip6963LoggedRdns = rdns;
        logApollo("info", "Extension detected (EIP-6963)", {
          name: detail.info?.name,
          rdns: detail.info?.rdns,
          provider: inspectApolloProvider(detail.provider),
        });
      }

      detail.provider = wrapProvider(detail.provider);
      rememberAnnouncement(detail.info, detail.provider);
    },
    true
  );

  window.dispatchEvent(new Event("eip6963:requestProvider"));

  queueMicrotask(() => {
    const sdk = getApolloWalletSdk();
    if (sdk) {
      logApollo("info", "Extension ready on page load", inspectApolloSdk(sdk));
    }
  });
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
  const inject = eip6963InjectProvider ?? resolveApolloConnectProvider();
  return inject ? wrapProvider(inject) : undefined;
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
