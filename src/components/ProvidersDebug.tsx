"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ApolloWalletDebugLog,
  clearApolloWalletDebugLogs,
  getApolloWalletDebugLogs,
  getApolloWalletDebugState,
  getApolloWalletProvider,
  isApolloWalletInstalled,
  pushApolloWalletDebugLog,
  requestApolloWalletProviders,
  subscribeApolloWalletDebugLogs,
} from "@/lib/wagmi/apollo-wallet-provider";
import { useAccount, useConnect, useConnectors } from "wagmi";

type Eip6963Entry = {
  ts: string;
  name?: string;
  rdns?: string;
  uuid?: string;
  isApollo: boolean;
};

function safeStringify(obj: unknown) {
  const cache = new WeakSet();
  return JSON.stringify(
    obj,
    function (_key, value) {
      if (typeof value === "function") return "[Function]";
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) return "[Circular]";
        cache.add(value);
      }
      return value;
    },
    2
  );
}

function logLevelColor(level: ApolloWalletDebugLog["level"]) {
  if (level === "error") return "#f87171";
  if (level === "warn") return "#fbbf24";
  return "#86efac";
}

export default function ProvidersDebug() {
  const [logs, setLogs] = useState<ApolloWalletDebugLog[]>([]);
  const [eip6963Providers, setEip6963Providers] = useState<Eip6963Entry[]>([]);
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const { address, chainId, status, connector } = useAccount();
  const { status: connectStatus, error: connectError } = useConnect();
  const connectors = useConnectors();

  const refreshLogs = useCallback(() => {
    setLogs(getApolloWalletDebugLogs());
  }, []);

  const refreshSnapshot = useCallback(async () => {
    try {
      const win = window as any;
      const ethereum = win.ethereum;
      const apolloProvider = getApolloWalletProvider();

      let apolloChainId: unknown = null;
      let apolloAccounts: unknown = null;

      if (apolloProvider?.request) {
        apolloChainId = await apolloProvider
          .request({ method: "eth_chainId" })
          .catch((e: unknown) => `error: ${String(e)}`);
        apolloAccounts = await apolloProvider
          .request({ method: "eth_accounts" })
          .catch((e: unknown) => `error: ${String(e)}`);
      }

      const ethChainId = ethereum?.request
        ? await ethereum.request({ method: "eth_chainId" }).catch((e: unknown) => `error: ${String(e)}`)
        : null;
      const ethAccounts = ethereum?.request
        ? await ethereum.request({ method: "eth_accounts" }).catch((e: unknown) => `error: ${String(e)}`)
        : null;

      setSnapshot({
        apollo: getApolloWalletDebugState(),
        wagmi: {
          status,
          address,
          chainId,
          connector: connector?.name ?? connector?.id ?? null,
          connectStatus,
          connectError: connectError?.message ?? null,
          connectors: connectors.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            ready: c.ready,
          })),
        },
        window: {
          hasEthereum: Boolean(ethereum),
          ethereumIsMetaMask: Boolean(ethereum?.isMetaMask),
          providerCount: Array.isArray(ethereum?.providers) ? ethereum.providers.length : null,
          apolloKeys: Object.keys(win).filter((k) => /apollo|muse/i.test(k)),
          hasApolloWallet: Boolean(win.apolloWallet),
          hasApollo: Boolean(win.apollo),
          hasMuses: Boolean(win.muses),
        },
        probes: {
          apolloChainId,
          apolloAccounts,
          ethChainId,
          ethAccounts,
        },
      });
    } catch (e) {
      setSnapshot({ error: String(e) });
    }
  }, [address, chainId, connectError, connectStatus, connector, connectors, status]);

  useEffect(() => {
    pushApolloWalletDebugLog("ProvidersDebug panel opened");
    refreshLogs();

    const unsubLogs = subscribeApolloWalletDebugLogs(refreshLogs);

    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const info = detail?.info;
      const name = String(info?.name ?? "").toLowerCase();
      const rdns = String(info?.rdns ?? "").toLowerCase();
      const isApollo =
        name.includes("apollo") ||
        name.includes("muses") ||
        rdns.includes("apollo") ||
        rdns.includes("muses");

      const entry: Eip6963Entry = {
        ts: new Date().toISOString(),
        name: info?.name,
        rdns: info?.rdns,
        uuid: info?.uuid,
        isApollo,
      };

      setEip6963Providers((prev) => {
        const key = info?.uuid ?? info?.rdns ?? info?.name ?? entry.ts;
        const without = prev.filter((p) => (p.uuid ?? p.rdns ?? p.name) !== key);
        return [entry, ...without].slice(0, 30);
      });

      pushApolloWalletDebugLog(`EIP-6963 announce: ${info?.name ?? "unknown"}`, {
        rdns: info?.rdns,
        uuid: info?.uuid,
        isApollo,
      });
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    requestApolloWalletProviders();

    refreshSnapshot();
    const timer = window.setInterval(refreshSnapshot, 3000);

    return () => {
      unsubLogs();
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      window.clearInterval(timer);
    };
  }, [refreshLogs, refreshSnapshot]);

  useEffect(() => {
    if (status === "connected" && address) {
      pushApolloWalletDebugLog("wagmi connected", { address, chainId, connector: connector?.name });
      refreshLogs();
    }
  }, [address, chainId, connector?.name, refreshLogs, status]);

  useEffect(() => {
    if (connectStatus === "error" && connectError) {
      pushApolloWalletDebugLog("wagmi connect error", { message: connectError.message }, "error");
      refreshLogs();
    }
  }, [connectError, connectStatus, refreshLogs]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed",
          right: 12,
          bottom: 12,
          zIndex: 99999,
          background: "rgba(0,0,0,0.85)",
          color: "#86efac",
          border: "1px solid #333",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Providers Debug ({logs.length})
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 99999,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: 12,
        borderRadius: 8,
        width: 520,
        maxHeight: "70vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontSize: 11,
        border: "1px solid #333",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Providers Debug</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              clearApolloWalletDebugLogs();
              refreshLogs();
            }}
            style={btnStyle}
          >
            Clear logs
          </button>
          <button type="button" onClick={() => refreshSnapshot()} style={btnStyle}>
            Refresh
          </button>
          <button type="button" onClick={() => setCollapsed(true)} style={btnStyle}>
            Minimize
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Badge label="Apollo installed" ok={isApolloWalletInstalled()} />
        <Badge label="Wagmi" value={status} />
        <Badge label="Connect" value={connectStatus} />
        {address ? <Badge label="Address" value={`${address.slice(0, 6)}…${address.slice(-4)}`} /> : null}
        {chainId ? <Badge label="Chain" value={String(chainId)} /> : null}
      </div>

      <Section title="Live log (newest first)">
        <div
          style={{
            maxHeight: 180,
            overflow: "auto",
            background: "#111",
            borderRadius: 4,
            padding: 6,
            fontFamily: "monospace",
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: "#888" }}>No logs yet — click Connect Wallet → Apollo Wallet</div>
          ) : (
            logs.map((entry, i) => (
              <div key={`${entry.ts}-${i}`} style={{ marginBottom: 4, borderBottom: "1px solid #222", paddingBottom: 4 }}>
                <div style={{ color: "#888" }}>
                  {entry.ts.slice(11, 23)}{" "}
                  <span style={{ color: logLevelColor(entry.level) }}>[{entry.level}]</span>{" "}
                  {entry.message}
                </div>
                {entry.data !== undefined ? (
                  <pre style={{ margin: "2px 0 0", whiteSpace: "pre-wrap", color: "#ccc", fontSize: 10 }}>
                    {safeStringify(entry.data)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </Section>

      <Section title="EIP-6963 providers">
        <div style={{ maxHeight: 100, overflow: "auto" }}>
          {eip6963Providers.length === 0 ? (
            <div style={{ color: "#888" }}>None announced yet</div>
          ) : (
            eip6963Providers.map((p) => (
              <div key={p.uuid ?? p.rdns ?? p.ts} style={{ marginBottom: 4 }}>
                <span style={{ color: p.isApollo ? "#fbbf24" : "#86efac" }}>
                  {p.isApollo ? "★ " : ""}
                  {p.name ?? "unknown"}
                </span>
                <span style={{ color: "#888" }}> — {p.rdns ?? "no rdns"}</span>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section title="Snapshot">
        <pre
          style={{
            maxHeight: 140,
            overflow: "auto",
            margin: 0,
            whiteSpace: "pre-wrap",
            background: "#111",
            borderRadius: 4,
            padding: 6,
            fontSize: 10,
          }}
        >
          {snapshot ? safeStringify(snapshot) : "Loading…"}
        </pre>
      </Section>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#222",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: 4,
  padding: "2px 8px",
  fontSize: 10,
  cursor: "pointer",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "#aaa", fontSize: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Badge({ label, value, ok }: { label: string; value?: string; ok?: boolean }) {
  const color = ok === undefined ? "#ddd" : ok ? "#86efac" : "#f87171";
  const text = value ?? (ok ? "yes" : "no");
  return (
    <span
      style={{
        background: "#222",
        border: "1px solid #333",
        borderRadius: 4,
        padding: "2px 6px",
        color,
      }}
    >
      {label}: {text}
    </span>
  );
}
