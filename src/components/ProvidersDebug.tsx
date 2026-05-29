"use client"
import React, { useEffect, useState } from "react";

function safeStringify(obj: any) {
  const cache = new WeakSet();
  return JSON.stringify(obj, function (key, value) {
    if (typeof value === "function") return "[Function]";
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) return "[Circular]";
      cache.add(value);
    }
    return value;
  }, 2);
}

export default function ProvidersDebug() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const win = window as any;
        const ethereum = win.ethereum;
        const providers = ethereum?.providers || null;
        const keys = Object.keys(win).filter((k) => /muse/i.test(k));
        const muses = win.muses;
        const musesKeys = muses && typeof muses === "object" ? Object.keys(muses) : [];

        const ethAccounts = ethereum?.request ? await ethereum.request({ method: "eth_accounts" }) : null;
        const ethChainId = ethereum?.request ? await ethereum.request({ method: "eth_chainId" }) : null;

        // Keep this panel passive so it never opens the wallet by itself.
        // Only read non-prompting values here.
        const musesAccounts = muses?.getAccounts ? await muses.getAccounts().catch((e: any) => `error: ${String(e)}`) : null;
        const musesChain = muses?.getNetwork ? await muses.getNetwork().catch((e: any) => `error: ${String(e)}`) : null;

        const nextInfo = {
          ethereum,
          providers,
          keys,
          musesKeys,
          samples: {
            ethAccounts,
            ethChainId,
            musesAccounts,
            musesChain,
          },
        };

        if (alive) setInfo(nextInfo);
      } catch (e) {
        if (alive) setInfo({ error: String(e) });
      }
    };

    load();

    const timer = window.setInterval(load, 2000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!info) return null;

  return (
    <div style={{
      position: "fixed",
      right: 12,
      bottom: 12,
      zIndex: 99999,
      background: "rgba(0,0,0,0.75)",
      color: "white",
      padding: 12,
      borderRadius: 8,
      maxWidth: 480,
      maxHeight: "50vh",
      overflow: "auto",
      fontSize: 12,
    }}>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>Providers Debug</div>
      <pre style={{ whiteSpace: "pre-wrap" }}>{safeStringify(info)}</pre>
    </div>
  );
}
