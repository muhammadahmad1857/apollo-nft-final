// /* eslint-disable @typescript-eslint/no-explicit-any */

// import { apolloMainnet } from "./apollo-chain";

// const APOLLO_CHAIN_HEX = `0x${apolloMainnet.id.toString(16)}`;
// const APOLLO_WRAPPED = Symbol.for("apollo.wallet.wrapped");
// const APOLLO_RAW_PROVIDER = Symbol.for("apollo.wallet.raw");
// const wrappedProviderCache = new WeakMap<object, any>();
// const MAX_DEBUG_LOGS = 150;
// const CONNECT_ACCOUNTS_TIMEOUT_MS = 60_000;
// const LOG_PREFIX = "[Apollo Wallet]";
// let suppressEmptyAccountsChangedWarn = false;

// function debugIngest(
//   _location: string,
//   _message: string,
//   _data: Record<string, unknown>,
//   _hypothesisId: string,
//   _runId = "pre-fix"
// ) {
//   // disabled — debug ingest server not used in production
// }

// function callApolloMethod(raw: any, methodName: string, ...args: unknown[]) {
//   if (typeof raw?.[methodName] === "function") {
//     return raw[methodName](...args);
//   }
//   try {
//     const proto = Object.getPrototypeOf(raw);
//     if (proto && typeof proto[methodName] === "function") {
//       return proto[methodName].call(raw, ...args);
//     }
//   } catch {
//     // ignore
//   }
//   return undefined;
// }

// function notifyManualConnectRequired() {
//   if (typeof window === "undefined") return;
//   window.dispatchEvent(
//     new CustomEvent("apollo-wallet:manual-connect-required", {
//       detail: { host: window.location.host },
//     })
//   );
// }

// /** Canonical brand icon — same in Popular (not installed) and after EIP-6963 discovery. */
// export const APOLLO_WALLET_BRAND_ICON = "/icons/apollo-wallet.png";

// type ApolloDebugLogLevel = "info" | "warn" | "error";

// export type ApolloWalletDebugLog = {
//   ts: string;
//   level: ApolloDebugLogLevel;
//   message: string;
//   data?: unknown;
// };

// const debugLogs: ApolloWalletDebugLog[] = [];
// const debugSubscribers = new Set<() => void>();

// /** Always logs to console so you can debug without ?showProviders=1 */
// function logApollo(level: ApolloDebugLogLevel, message: string, data?: unknown) {
//   const entry: ApolloWalletDebugLog = {
//     ts: new Date().toISOString(),
//     level,
//     message,
//     data,
//   };
//   debugLogs.unshift(entry);
//   if (debugLogs.length > MAX_DEBUG_LOGS) debugLogs.pop();
//   debugSubscribers.forEach((fn) => fn());

//   const line = data !== undefined ? `${LOG_PREFIX} ${message}` : `${LOG_PREFIX} ${message}`;
//   if (level === "error") console.error(line, data ?? "");
//   else if (level === "warn") console.warn(line, data ?? "");
//   else console.info(line, data ?? "");
// }

// export function pushApolloWalletDebugLog(
//   message: string,
//   data?: unknown,
//   level: ApolloDebugLogLevel = "info"
// ) {
//   logApollo(level, message, data);
// }

// export function getApolloWalletDebugLogs() {
//   return [...debugLogs];
// }

// export function subscribeApolloWalletDebugLogs(cb: () => void) {
//   debugSubscribers.add(cb);
//   return () => debugSubscribers.delete(cb);
// }

// export function clearApolloWalletDebugLogs() {
//   debugLogs.length = 0;
//   debugSubscribers.forEach((fn) => fn());
// }

// export function getApolloWalletDebugState() {
//   const sdk = getApolloWalletSdk();
//   const provider = resolveApolloConnectProvider();
//   return {
//     rdns: getApolloWalletRdns(),
//     name: getApolloWalletName(),
//     icon: getApolloWalletIcon(),
//     installed: isApolloWalletInstalled(),
//     sdk: inspectApolloSdk(sdk),
//     connectProviderSource: describeProviderSource(provider),
//     expectedChainHex: APOLLO_CHAIN_HEX,
//   };
// }

// export const APOLLO_WALLET_CHROME_STORE_URL =
//   "https://chromewebstore.google.com/detail/apollo-wallet/mnpnahmgchhkjphkkemhbnjedajbcbll";

// export const APOLLO_WALLET_WEBSITE_URL = "https://apollowallet.io";

// const APOLLO_PROVIDER_FLAGS = [
//   "isApolloWallet",
//   "isApollo",
//   "isMuses",
//   "isMusesWallet",
//   "isMusesProvider",
// ] as const;

// let eip6963ApolloProvider: any;
// let eip6963InjectProvider: any;
// let eip6963ApolloRdns: string | undefined;
// let eip6963ApolloName: string | undefined;
// let eip6963LoggedRdns: string | undefined;

// function isApolloAnnouncement(info: { name?: string; rdns?: string } | undefined) {
//   const name = String(info?.name ?? "").toLowerCase();
//   const rdns = String(info?.rdns ?? "").toLowerCase();
//   return (
//     name.includes("apollo") ||
//     name.includes("muses") ||
//     rdns.includes("apollo") ||
//     rdns.includes("muses")
//   );
// }

// function rememberAnnouncement(info: any, provider: any) {
//   if (!isApolloAnnouncement(info) || !provider) return;
//   eip6963ApolloProvider = provider;
//   if (info?.rdns) eip6963ApolloRdns = info.rdns;
//   if (info?.name) eip6963ApolloName = info.name;
// }

// function isWrapped(provider: any) {
//   return Boolean(provider?.[APOLLO_WRAPPED]);
// }

// function getUnwrappedProvider(provider: any) {
//   return provider?.[APOLLO_RAW_PROVIDER] ?? provider;
// }

// function normalizeAccounts(value: any) {
//   if (value == null) return [];
//   if (Array.isArray(value)) return value;
//   if (typeof value === "string" && value.length > 0) return [value];
//   if (value && Array.isArray(value.accounts)) return value.accounts;
//   if (value && typeof value === "object" && typeof value.address === "string") {
//     return [value.address];
//   }
//   return [];
// }

// function looksLikeProvider(value: any) {
//   if (!value || typeof value !== "object") return false;
//   return (
//     typeof value.request === "function" ||
//     typeof value.requestAccounts === "function" ||
//     typeof value.getAccounts === "function" ||
//     typeof value.connect === "function"
//   );
// }

// /** Apollo exposes request() on the prototype — Object.keys misses it. */
// function inspectApolloProvider(obj: any) {
//   if (!obj || typeof obj !== "object") return null;

//   const ownKeys = Object.getOwnPropertyNames(obj);
//   let protoMethods: string[] = [];
//   try {
//     const proto = Object.getPrototypeOf(obj);
//     if (proto) {
//       protoMethods = Object.getOwnPropertyNames(proto).filter(
//         (k) => k !== "constructor" && typeof proto[k] === "function"
//       );
//     }
//   } catch {
//     // ignore
//   }

//   return {
//     ownKeys,
//     protoMethods,
//     hasRequest: typeof obj.request === "function",
//     hasConnect: typeof obj.connect === "function",
//     selectedAddress: obj.selectedAddress ?? null,
//     activeAddress: obj.activeAddress ?? null,
//     connected: obj.connected ?? null,
//     chainId: obj.chainId ?? null,
//   };
// }

// function getRawApolloProvider() {
//   return eip6963InjectProvider ?? getApolloWalletSdk();
// }

// function readAddressesFromProviderState(provider: any) {
//   const sdk = getApolloWalletSdk();
//   return filterEvmAccounts([
//     provider?.selectedAddress,
//     provider?.activeAddress,
//     sdk?.selectedAddress,
//     sdk?.activeAddress,
//   ]);
// }

// function isEthAddress(value: unknown) {
//   return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
// }

// function filterEvmAccounts(value: any) {
//   return normalizeAccounts(value).filter(isEthAddress);
// }

// export function getApolloWalletSdk() {
//   if (typeof window === "undefined") return undefined;
//   const win = window as any;
//   return win.apolloWallet ?? win.apollo ?? win.muses;
// }

// function inspectApolloSdk(sdk: any) {
//   return inspectApolloProvider(sdk);
// }

// function describeProviderSource(provider: any) {
//   if (!provider || typeof window === "undefined") return "none";
//   const win = window as any;
//   const sdk = getApolloWalletSdk();
//   if (provider === sdk) return "window.apolloWallet (sdk root)";
//   if (provider === sdk?.ethereum) return "window.apolloWallet.ethereum (= inject stub if same as window.ethereum)";
//   if (provider === sdk?.provider) return "window.apolloWallet.provider";
//   if (provider === sdk?.evm) return "window.apolloWallet.evm";
//   if (provider === eip6963InjectProvider) return "eip6963 inject stub";
//   if (provider === win.ethereum) return "window.ethereum";
//   return "other";
// }

// function isInjectStub(provider: any) {
//   if (typeof window === "undefined") return false;
//   const win = window as any;
//   return provider === win.ethereum || provider === eip6963InjectProvider;
// }

// export function resolveApolloConnectProvider() {
//   if (typeof window === "undefined") return undefined;
//   const sdk = getApolloWalletSdk();
//   if (sdk) {
//     const sdkCandidates = [sdk, sdk.provider, sdk.evm, sdk.ethereum].filter(Boolean);
//     const sdkProvider = sdkCandidates.find(looksLikeProvider);
//     if (sdkProvider) return sdkProvider;
//   }
//   if (eip6963InjectProvider && looksLikeProvider(eip6963InjectProvider)) {
//     return eip6963InjectProvider;
//   }
//   if (eip6963ApolloProvider) return getUnwrappedProvider(eip6963ApolloProvider);
//   return findFlaggedInjectedApolloProvider();
// }

// function stubApolloWalletPermissions(params?: unknown[]) {
//   const requested =
//     params?.[0] && typeof params[0] === "object" && !Array.isArray(params[0])
//       ? (params[0] as Record<string, unknown>)
//       : { eth_accounts: {} };

//   const capabilities = Object.keys(requested);
//   const list =
//     capabilities.length > 0 ? capabilities : ["eth_accounts"];

//   return list.map((parentCapability) => ({
//     parentCapability,
//     caveats: [{ type: "restrictReturnedAccounts", value: [] as string[] }],
//   }));
// }

// function requestProviderWithTimeout(
//   raw: any,
//   payload: { method: string; params?: unknown[] },
//   timeoutMs: number
// ) {
//   return Promise.race([
//     raw.request(payload),
//     new Promise<never>((_, reject) => {
//       window.setTimeout(
//         () =>
//           reject(
//             new Error(
//               `Timed out after ${timeoutMs / 1000}s waiting for ${payload.method}. Open Apollo Wallet, unlock it, approve this site, then retry.`
//             )
//           ),
//         timeoutMs
//       );
//     }),
//   ]);
// }

// function getProviderIdentityDiagnostic(raw: any) {
//   const win = typeof window !== "undefined" ? (window as any) : {};
//   const sdk = getApolloWalletSdk();
//   const inspection = inspectApolloProvider(raw);
//   return {
//     rawIsSdk: raw === sdk,
//     rawIsEip6963Inject: raw === eip6963InjectProvider,
//     rawIsWindowEthereum: raw === win.ethereum,
//     sdkIsWindowEthereum: sdk === win.ethereum,
//     sdkChainIdProp: sdk?.chainId ?? null,
//     rawChainIdProp: raw?.chainId ?? null,
//     expectedChainHex: APOLLO_CHAIN_HEX,
//     protoMethods: inspection?.protoMethods ?? [],
//   };
// }

// function isRpcUrlInjectError(err: unknown) {
//   const msg = err instanceof Error ? err.message : String(err);
//   return msg.includes("rpcUrl");
// }

// function getApolloAddChainParams() {
//   return {
//     chainId: APOLLO_CHAIN_HEX,
//     chainName: apolloMainnet.name,
//     nativeCurrency: apolloMainnet.nativeCurrency,
//     rpcUrls: [apolloMainnet.rpcUrls.default.http[0]],
//     blockExplorerUrls: [apolloMainnet.blockExplorers.default.url],
//   };
// }

// /** Apollo inject internal APIs — register rpcUrl / open approval UI before eth_requestAccounts. */
// async function tryApolloSetChainId(raw: any) {
//   const chainParams = getApolloAddChainParams();
//   const candidates: unknown[] = [
//     // Apollo inject reads a flat `rpcUrl` key — must come first or the object-without-rpcUrl
//     // variant "succeeds" silently without actually registering the rpcUrl, causing the crash.
//     { ...chainParams, rpcUrl: chainParams.rpcUrls[0] },
//     chainParams,
//     APOLLO_CHAIN_HEX,
//     apolloMainnet.id,
//   ];

//   for (const chainId of candidates) {
//     try {
//       const result = callApolloMethod(raw, "setChainId", chainId);
//       if (result !== undefined) {
//         await result;
//         logApollo("info", "setChainId succeeded", { chainId });
//         return true;
//       }
//     } catch (err) {
//       logApollo("warn", "setChainId failed", {
//         chainId,
//         error: err instanceof Error ? err.message : String(err),
//       });
//     }
//   }
//   return false;
// }

// /** Opens the extension connect/approval UI without going through broken rpcUrl path. */
// async function tryApolloCheckConnectionState(raw: any) {
//   for (const method of ["checkConnectionState", "enable", "openConnectModal"] as const) {
//     try {
//       const result = callApolloMethod(raw, method);
//       if (result !== undefined) {
//         await result;
//         logApollo("info", `${method} completed — confirm in extension if prompted`);
//         return true;
//       }
//     } catch (err) {
//       logApollo("warn", `${method} failed`, {
//         error: err instanceof Error ? err.message : String(err),
//       });
//     }
//   }
//   return false;
// }

// async function requestApolloAccounts(raw: any, timeoutMs: number) {
//   const result = await requestProviderWithTimeout(
//     raw,
//     { method: "eth_requestAccounts" },
//     timeoutMs
//   );
//   const accounts = filterEvmAccounts(result);
//   if (accounts.length) return accounts;

//   const fromState = readAddressesFromProviderState(raw);
//   if (fromState.length) {
//     logApollo("info", "Using selectedAddress/activeAddress from provider", fromState);
//     return fromState;
//   }

//   throw new Error("No account returned — approve the connection in the Apollo Wallet extension popup.");
// }

// /** Register + switch to Apollo Mainnet before account requests (inject crashes on null rpcUrl when chain missing). */
// async function ensureApolloChainBeforeConnect(raw: any) {
//   const identity = getProviderIdentityDiagnostic(raw);
//   // #region agent log
//   debugIngest(
//     "apollo-wallet-provider.ts:ensureApolloChain:entry",
//     "provider identity at connect",
//     identity,
//     "D"
//   );
//   // #endregion

//   let currentChain: string | null = null;
//   try {
//     currentChain = (await raw.request({ method: "eth_chainId" })) as string;
//   } catch (err) {
//     // #region agent log
//     debugIngest(
//       "apollo-wallet-provider.ts:ensureApolloChain:chainIdError",
//       "eth_chainId failed",
//       { error: err instanceof Error ? err.message : String(err) },
//       "A"
//     );
//     // #endregion
//   }

//   const alreadyApollo =
//     currentChain != null && currentChain.toLowerCase() === APOLLO_CHAIN_HEX.toLowerCase();
//   // #region agent log
//   debugIngest(
//     "apollo-wallet-provider.ts:ensureApolloChain:chainState",
//     "chain state before prep",
//     { currentChain, expectedChain: APOLLO_CHAIN_HEX, alreadyApollo },
//     "A"
//   );
//   // #endregion

//   // setChainId registers rpcUrl in the extension — required even when eth_chainId already matches.
//   const setChainOk = await tryApolloSetChainId(raw);
//   if (setChainOk) {
//     try {
//       const afterSet = (await raw.request({ method: "eth_chainId" })) as string;
//       if (afterSet.toLowerCase() === APOLLO_CHAIN_HEX.toLowerCase()) {
//         return {
//           currentChain,
//           chainPrepared: true,
//           prepMethod: "setChainId" as const,
//           afterChain: afterSet,
//         };
//       }
//     } catch {
//       // continue with wallet_addEthereumChain / switch fallbacks
//     }
//   }

//   if (alreadyApollo) {
//     return { currentChain, chainPrepared: true, prepMethod: "already-apollo" as const };
//   }

//   const apolloChainParams = getApolloAddChainParams();

//   // Add chain first — registers rpcUrl in extension before switch/account RPC.
//   try {
//     await raw.request({ method: "wallet_addEthereumChain", params: [apolloChainParams] });
//     const afterAdd = (await raw.request({ method: "eth_chainId" })) as string;
//     // #region agent log
//     debugIngest(
//       "apollo-wallet-provider.ts:ensureApolloChain:addOk",
//       "wallet_addEthereumChain succeeded",
//       { afterAdd },
//       "B"
//     );
//     // #endregion
//     if (afterAdd.toLowerCase() === APOLLO_CHAIN_HEX.toLowerCase()) {
//       return { currentChain, chainPrepared: true, prepMethod: "add" as const, afterChain: afterAdd };
//     }
//   } catch (addErr) {
//     // #region agent log
//     debugIngest(
//       "apollo-wallet-provider.ts:ensureApolloChain:addFail",
//       "wallet_addEthereumChain failed",
//       { error: addErr instanceof Error ? addErr.message : String(addErr) },
//       "B"
//     );
//     // #endregion
//   }

//   try {
//     await raw.request({
//       method: "wallet_switchEthereumChain",
//       params: [{ chainId: APOLLO_CHAIN_HEX }],
//     });
//     const afterSwitch = (await raw.request({ method: "eth_chainId" })) as string;
//     // #region agent log
//     debugIngest(
//       "apollo-wallet-provider.ts:ensureApolloChain:switchOk",
//       "wallet_switchEthereumChain succeeded",
//       { afterSwitch },
//       "B"
//     );
//     // #endregion
//     if (afterSwitch.toLowerCase() === APOLLO_CHAIN_HEX.toLowerCase()) {
//       return { currentChain, chainPrepared: true, prepMethod: "switch" as const, afterChain: afterSwitch };
//     }
//   } catch (switchErr) {
//     // #region agent log
//     debugIngest(
//       "apollo-wallet-provider.ts:ensureApolloChain:switchFail",
//       "wallet_switchEthereumChain failed",
//       { error: switchErr instanceof Error ? switchErr.message : String(switchErr) },
//       "B"
//     );
//     // #endregion
//   }

//   return { currentChain, chainPrepared: false, prepMethod: "none" as const };
// }

// async function recoverApolloAccountsAfterRpcUrlCrash(
//   raw: any,
//   timeoutMs: number
// ): Promise<string[]> {
//   logApollo("warn", "eth_requestAccounts rpcUrl crash — registering chain then retrying");

//   try {
//     const chainParams = getApolloAddChainParams();
//     await raw.request({
//       method: "wallet_addEthereumChain",
//       // Apollo inject requires flat `rpcUrl` key — standard `rpcUrls` array crashes it.
//       params: [{ ...chainParams, rpcUrl: chainParams.rpcUrls[0] }],
//     });
//     logApollo("info", "wallet_addEthereumChain succeeded — retrying eth_requestAccounts");
//   } catch (addErr) {
//     logApollo("warn", "wallet_addEthereumChain failed", {
//       error: addErr instanceof Error ? addErr.message : String(addErr),
//     });
//     await tryApolloSetChainId(raw);
//   }
//   try {
//     return await requestApolloAccounts(raw, Math.min(timeoutMs, 30_000));
//   } catch (retryErr) {
//     const errMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
//     logApollo("error", "eth_requestAccounts failed after chain registration", { error: errMsg });
//     notifyManualConnectRequired();
//     throw new Error(
//       "Apollo Wallet could not connect. Open the extension, switch to Apollo Mainnet, approve this site under Connected Sites, then retry."
//     );
//   }
// }

// /**
//  * Apollo Wallet (io.zeusx.apollowallet) exposes window.apolloWallet as an EIP-1193
//  * provider with request() on the prototype — NOT a separate connect() SDK.
//  *
//  * wallet_requestPermissions is broken in current Apollo inject (rpcUrl null) — skip it.
//  */
// async function connectViaProviderRpc(raw: any): Promise<string[]> {
//   if (typeof raw?.request !== "function") {
//     throw new Error("Apollo provider has no request() method.");
//   }

//   logApollo("info", "Connect path: ensure Apollo chain → eth_requestAccounts");
//   logApollo("info", "Provider state before connect", inspectApolloProvider(raw));

//   const chainPrep = await ensureApolloChainBeforeConnect(raw);
//   logApollo("info", "Chain prep result", chainPrep);

//   await tryApolloCheckConnectionState(raw);

//   logApollo("info", "eth_requestAccounts — extension approval popup should open NOW");

//   try {
//     const accounts = await requestApolloAccounts(raw, CONNECT_ACCOUNTS_TIMEOUT_MS);
//     logApollo("info", "eth_requestAccounts succeeded", { accounts });
//     return accounts;
//   } catch (err) {
//     const errMsg = err instanceof Error ? err.message : String(err);
//     logApollo("warn", "eth_requestAccounts failed", {
//       error: errMsg,
//       hasRpcUrlError: isRpcUrlInjectError(err),
//     });

//     if (isRpcUrlInjectError(err)) {
//       return recoverApolloAccountsAfterRpcUrlCrash(raw, CONNECT_ACCOUNTS_TIMEOUT_MS);
//     }
//     throw err;
//   }
// }

// export async function connectApolloWallet(): Promise<string[]> {
//   logApollo("info", "─── CONNECT START ───");
//   suppressEmptyAccountsChangedWarn = true;

//   try {
//     const sdk = getApolloWalletSdk();
//     if (!sdk) {
//       logApollo("error", "window.apolloWallet not found — install the extension.");
//       throw new Error("Apollo Wallet extension not found.");
//     }

//     logApollo("info", "window.apolloWallet inspection", inspectApolloProvider(sdk));

//     const raw = getRawApolloProvider();
//     if (!raw) {
//       throw new Error("Apollo provider not found.");
//     }

//     logApollo("info", "Using inject provider for connect", {
//       source: describeProviderSource(getUnwrappedProvider(raw)),
//     });

//     const accounts = await connectViaProviderRpc(getUnwrappedProvider(raw));
//     logApollo("info", "─── CONNECT SUCCESS ───", accounts);
//     return accounts;
//   } catch (err) {
//     logApollo("error", "─── CONNECT FAILED ───", {
//       error: err instanceof Error ? err.message : String(err),
//       hint:
//         "If no popup appeared: unlock Apollo Wallet extension → Connected Sites → approve this site → retry.",
//     });
//     throw err instanceof Error ? err : new Error(String(err));
//   } finally {
//     suppressEmptyAccountsChangedWarn = false;
//   }
// }

// function wrapProvider(raw: any) {
//   if (!raw) return undefined;
//   if (isWrapped(raw)) return raw;

//   const cached = wrappedProviderCache.get(raw);
//   if (cached) return cached;

//   let hasConnectedAccounts = false;
//   let connectInProgress = false;
//   const listenerMap = new Map<string, Map<(...args: any[]) => void, (...args: any[]) => void>>();

//   const resetConnectionState = (reason: string) => {
//     hasConnectedAccounts = false;
//     connectInProgress = false;
//     logApollo("info", `Session reset: ${reason}`);
//   };

//   if (typeof raw.on === "function") {
//     raw.on("disconnect", () => resetConnectionState("extension disconnect event"));
//   }

//   const request = async ({ method, params }: { method: string; params?: any[] }) => {
//     logApollo("info", `RPC request: ${method}`, {
//       via: describeProviderSource(raw),
//       isInjectStub: isInjectStub(raw),
//     });

//     if (method === "eth_requestAccounts") connectInProgress = true;

//     try {
//       if (method === "wallet_requestPermissions") {
//         const unwrapped = getUnwrappedProvider(raw);
//         await ensureApolloChainBeforeConnect(unwrapped);
//         await tryApolloSetChainId(unwrapped);
//         try {
//           const result = await unwrapped.request({ method, params });
//           logApollo("info", "wallet_requestPermissions succeeded", { result });
//           return result;
//         } catch (err) {
//           if (isRpcUrlInjectError(err)) {
//             logApollo("info", "wallet_requestPermissions rpcUrl bug — opening extension connect UI");
//             await tryApolloCheckConnectionState(unwrapped);
//             await tryApolloSetChainId(unwrapped);
//             return stubApolloWalletPermissions(params);
//           }
//           throw err;
//         }
//       }

//       if (method === "eth_requestAccounts") {
//         logApollo("info", "eth_requestAccounts — prepping chain then passing through to inject");
//         const unwrapped = getUnwrappedProvider(raw);
//         await ensureApolloChainBeforeConnect(unwrapped);
//         await tryApolloCheckConnectionState(unwrapped);

//         try {
//           const accounts = filterEvmAccounts(
//             await requestProviderWithTimeout(
//               unwrapped,
//               { method: "eth_requestAccounts" },
//               CONNECT_ACCOUNTS_TIMEOUT_MS
//             )
//           );
//           if (accounts.length) {
//             hasConnectedAccounts = true;
//             return accounts;
//           }
//           return recoverApolloAccountsAfterRpcUrlCrash(unwrapped, CONNECT_ACCOUNTS_TIMEOUT_MS);
//         } catch (err) {
//           if (isRpcUrlInjectError(err)) {
//             return recoverApolloAccountsAfterRpcUrlCrash(unwrapped, CONNECT_ACCOUNTS_TIMEOUT_MS);
//           }
//           throw err;
//         }
//       }

//       if (method === "wallet_revokePermissions") {
//         resetConnectionState("wallet_revokePermissions");
//         const sdk = getApolloWalletSdk();
//         try {
//           if (typeof sdk?.disconnect === "function") await sdk.disconnect();
//         } catch {
//           // best effort
//         }
//       }

//       if (typeof raw.request !== "function") {
//         throw new Error(`Apollo Wallet does not support ${method}`);
//       }

//       const result = await raw.request({ method, params });
//       logApollo("info", `RPC response: ${method}`, { result });
//       return result;
//     } catch (err) {
//       logApollo("error", `RPC failed: ${method}`, {
//         error: err instanceof Error ? err.message : String(err),
//       });
//       throw err;
//     } finally {
//       if (method === "eth_requestAccounts") connectInProgress = false;
//     }
//   };

//   const on = (event: string, listener: (...args: any[]) => void) => {
//     if (typeof raw.on !== "function") return;

//     const wrappedListener =
//       event === "accountsChanged"
//         ? (accounts: unknown) => {
//             const normalized = normalizeAccounts(accounts);
//             if (normalized.length === 0) {
//               if (connectInProgress) {
//                 if (!suppressEmptyAccountsChangedWarn) {
//                   logApollo("warn", "Ignored empty accountsChanged during connect (normal for Apollo inject)");
//                 }
//                 return;
//               }
//               if (hasConnectedAccounts) {
//                 resetConnectionState("accountsChanged cleared");
//                 listener(accounts);
//                 return;
//               }
//               return;
//             }
//             hasConnectedAccounts = true;
//             logApollo("info", "accountsChanged", normalized);
//             listener(accounts);
//           }
//         : (...args: any[]) => {
//             logApollo("info", `Event: ${event}`, args);
//             listener(...args);
//           };

//     if (!listenerMap.has(event)) listenerMap.set(event, new Map());
//     listenerMap.get(event)!.set(listener, wrappedListener);
//     raw.on(event, wrappedListener);
//   };

//   const removeListener = (event: string, listener: (...args: any[]) => void) => {
//     const wrapped = listenerMap.get(event)?.get(listener);
//     if (wrapped && typeof raw.removeListener === "function") {
//       raw.removeListener(event, wrapped);
//     }
//     listenerMap.get(event)?.delete(listener);
//   };

//   const wrapped = {
//     ...raw,
//     request,
//     on,
//     removeListener,
//     [APOLLO_WRAPPED]: true,
//     [APOLLO_RAW_PROVIDER]: raw,
//   };

//   wrappedProviderCache.set(raw, wrapped);
//   return wrapped;
// }

// if (typeof window !== "undefined") {
//   window.addEventListener(
//     "eip6963:announceProvider",
//     (event: Event) => {
//       const detail = (event as CustomEvent).detail;
//       if (!detail?.provider || !isApolloAnnouncement(detail.info)) return;

//       eip6963InjectProvider = detail.provider;

//       if (detail.info) detail.info.icon = APOLLO_WALLET_BRAND_ICON;

//       const rdns = detail.info?.rdns ?? detail.info?.name;
//       if (rdns !== eip6963LoggedRdns) {
//         eip6963LoggedRdns = rdns;
//         logApollo("info", "Extension detected (EIP-6963)", {
//           name: detail.info?.name,
//           rdns: detail.info?.rdns,
//           provider: inspectApolloProvider(detail.provider),
//         });
//       }

//       detail.provider = wrapProvider(detail.provider);
//       rememberAnnouncement(detail.info, detail.provider);
//     },
//     true
//   );

//   window.dispatchEvent(new Event("eip6963:requestProvider"));

//   queueMicrotask(() => {
//     const sdk = getApolloWalletSdk();
//     if (sdk) {
//       logApollo("info", "Extension ready on page load", inspectApolloSdk(sdk));
//     }
//   });
// }

// export function requestApolloWalletProviders() {
//   if (typeof window === "undefined") return;
//   window.dispatchEvent(new Event("eip6963:requestProvider"));
// }

// export function initApolloWalletDiscovery() {
//   if (typeof window === "undefined") return () => undefined;
//   requestApolloWalletProviders();
//   return () => undefined;
// }

// export function getApolloWalletRdns() {
//   return eip6963ApolloRdns ?? "io.apollowallet";
// }

// export function getApolloWalletIcon() {
//   return APOLLO_WALLET_BRAND_ICON;
// }

// export function getApolloWalletName() {
//   return eip6963ApolloName ?? "Apollo Wallet";
// }

// function findFlaggedInjectedApolloProvider() {
//   if (typeof window === "undefined") return undefined;
//   const win = window as any;
//   const providers = [win.ethereum, ...(Array.isArray(win.ethereum?.providers) ? win.ethereum.providers : [])]
//     .filter(Boolean);
//   return providers.find(
//     (provider) =>
//       looksLikeProvider(provider) &&
//       APOLLO_PROVIDER_FLAGS.some((flag) => Boolean(provider[flag]))
//   );
// }

// export function isApolloWalletInstalled() {
//   if (typeof window === "undefined") return false;
//   if (getApolloWalletSdk()) return true;
//   if (eip6963ApolloProvider || eip6963InjectProvider) return true;
//   return Boolean(findFlaggedInjectedApolloProvider());
// }

// export function getApolloWalletProvider() {
//   if (typeof window === "undefined") return undefined;
//   requestApolloWalletProviders();
//   const inject = eip6963InjectProvider ?? resolveApolloConnectProvider();
//   return inject ? wrapProvider(inject) : undefined;
// }

// export async function waitForApolloWalletProvider(timeoutMs = 6000) {
//   const started = Date.now();
//   while (Date.now() - started < timeoutMs) {
//     const provider = getApolloWalletProvider();
//     if (provider) return provider;
//     await new Promise((resolve) => setTimeout(resolve, 200));
//   }
//   return undefined;
// }

/* eslint-disable @typescript-eslint/no-explicit-any */

import { apolloMainnet } from "./apollo-chain";

const APOLLO_CHAIN_HEX = `0x${apolloMainnet.id.toString(16)}`;
const APOLLO_WRAPPED = Symbol.for("apollo.wallet.wrapped");
const APOLLO_RAW_PROVIDER = Symbol.for("apollo.wallet.raw");
const wrappedProviderCache = new WeakMap<object, any>();

const MAX_DEBUG_LOGS = 150;
const CONNECT_ACCOUNTS_TIMEOUT_MS = 60_000;
const LOG_PREFIX = "[Apollo Wallet]";

let suppressEmptyAccountsChangedWarn = false;

// ─────────────────────────────────────────────────────────────
// 🧠 DEBUG STATE (RESTORED PROPERLY)
// ─────────────────────────────────────────────────────────────

type ApolloDebugLogLevel = "info" | "warn" | "error";

export type ApolloWalletDebugLog = {
  ts: string;
  level: ApolloDebugLogLevel;
  message: string;
  data?: unknown;
};

const debugLogs: ApolloWalletDebugLog[] = [];
const debugSubscribers = new Set<() => void>();

// ─────────────────────────────────────────────────────────────
// 🧠 GLOBAL CRASH INTELLIGENCE
// ─────────────────────────────────────────────────────────────

let lastErrorStack: string | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("error", (e: any) => {
    lastErrorStack = e?.error?.stack || e?.message || String(e);
    console.error("[Apollo Wallet][GLOBAL ERROR]", lastErrorStack);
  });

  window.addEventListener("unhandledrejection", (e: any) => {
    lastErrorStack = e?.reason?.stack || e?.reason?.message || String(e?.reason);
    console.error("[Apollo Wallet][UNHANDLED REJECTION]", lastErrorStack);
  });
}

// ─────────────────────────────────────────────────────────────
// LOGGING ENGINE (RESTORED FULL)
// ─────────────────────────────────────────────────────────────

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

  const line = `${LOG_PREFIX} ${message}`;
  if (level === "error") console.error(line, data ?? "");
  else if (level === "warn") console.warn(line, data ?? "");
  else console.info(line, data ?? "");
}

// ─────────────────────────────────────────────────────────────
// 🔥 EXPORTED DEBUG API (FIXED BUILD ERROR HERE)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// CORE HELPERS
// ─────────────────────────────────────────────────────────────

function getApolloWalletSdk() {
  if (typeof window === "undefined") return undefined;
  const win = window as any;
  return win.apolloWallet ?? win.apollo ?? win.muses;
}

// ─────────────────────────────────────────────────────────────
// 🧬 PROXY CHAIN FIX (kept intact)
// ─────────────────────────────────────────────────────────────

function tryProxyChains(target: any) {
  if (!target || typeof target !== "object") return target;

  try {
    if (!target.chains || typeof target.chains !== "object") return target;

    const original = target.chains;
    if (original?.__apolloProxy) return target;

    const proxy = new Proxy(original, {
      get(t, prop: string) {
        const value = (t as any)[prop];

        if (!value && typeof prop === "string" && prop.startsWith("0x")) {
          logApollo("warn", `⚠️ Proxy fallback chain injected: ${prop}`);

          return {
            rpcUrl: apolloMainnet.rpcUrls.default.http[0],
            chainId: prop,
            chainName: apolloMainnet.name,
            nativeCurrency: apolloMainnet.nativeCurrency,
            blockExplorerUrl: apolloMainnet.blockExplorers.default.url,
          };
        }

        return value;
      },
    });

    (proxy as any).__apolloProxy = true;
    target.chains = proxy;

    logApollo("info", "🧬 chains proxy attached");
  } catch (e) {
    logApollo("warn", "Proxy chains failed", e);
  }

  return target;
}

// ─────────────────────────────────────────────────────────────
// PATCH CHAINS MAP
// ─────────────────────────────────────────────────────────────

function patchInjectChainsMap(raw: any): boolean {
  const rpcUrl = apolloMainnet.rpcUrls.default.http[0];

  const chainEntry = {
    rpcUrl,
    chainId: APOLLO_CHAIN_HEX,
    chainName: apolloMainnet.name,
    nativeCurrency: apolloMainnet.nativeCurrency,
    blockExplorerUrl: apolloMainnet.blockExplorers.default.url,
  };

  const chainMapKeys = [
    "chains",
    "_chains",
    "chainMap",
    "_chainMap",
    "networks",
    "_networks",
    "chainConfig",
  ];

  let patched = false;

  const targets = [raw, getApolloWalletSdk()].filter(Boolean);

  for (const target of targets) {
    try {
      for (const key of chainMapKeys) {
        const existing = target[key];

        if (existing && typeof existing === "object") {
          existing[APOLLO_CHAIN_HEX] = chainEntry;
          patched = true;
        }
      }

      tryProxyChains(target);
    } catch (e) {
      logApollo("warn", "patchInjectChainsMap error", e);
    }
  }

  return patched;
}

// ─────────────────────────────────────────────────────────────
// REQUEST WRAPPER
// ─────────────────────────────────────────────────────────────

function requestProviderWithTimeout(raw: any, payload: any, timeoutMs: number) {
  return Promise.race([
    raw.request(payload),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout ${payload.method}`)), timeoutMs)
    ),
  ]);
}

// ─────────────────────────────────────────────────────────────
// MAIN FLOW
// ─────────────────────────────────────────────────────────────

async function connectViaProviderRpc(raw: any): Promise<string[]> {
  logApollo("info", "═══ CONNECT START ═══");

  const patched = patchInjectChainsMap(raw);
  logApollo(patched ? "info" : "warn", patched ? "patched" : "patch failed");

  try {
    await raw.request({ method: "eth_requestAccounts" });

    logApollo("info", "eth_requestAccounts success");

    return [];
  } catch (err: any) {
    logApollo("error", "CRASH CAPTURED", {
      message: err?.message,
      stack: err?.stack,
      lastErrorStack,
    });

    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

export async function connectApolloWallet() {
  const sdk = getApolloWalletSdk();
  if (!sdk) throw new Error("Apollo Wallet not found");

  const raw = sdk.provider ?? sdk;
  return connectViaProviderRpc(raw);
}