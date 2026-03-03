"use client";

import { useEffect, useMemo, useState } from "react";
import { getNotificationsStreamUrl } from "@/lib/notificationsApi";

interface UseNotificationsStreamOptions {
  wallet?: string;
  onNotification?: () => void;
}

export function useNotificationsStream({
  wallet,
  onNotification,
}: UseNotificationsStreamOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [hasError, setHasError] = useState(false);

  const normalizedWallet = useMemo(
    () => wallet?.trim().toLowerCase() || "",
    [wallet]
  );

  useEffect(() => {
    if (!normalizedWallet || typeof window === "undefined") {
      return;
    }

    const eventSource = new EventSource(getNotificationsStreamUrl(normalizedWallet));

    const handleConnected = () => {
      setIsConnected(true);
      setHasError(false);
    };

    const handleNotification = () => {
      setIsConnected(true);
      setHasError(false);
      onNotification?.();
    };

    const handlePing = () => {
      setIsConnected(true);
      setHasError(false);
    };

    eventSource.addEventListener("connected", handleConnected);
    eventSource.addEventListener("notification", handleNotification);
    eventSource.addEventListener("ping", handlePing);

    eventSource.onerror = () => {
      setIsConnected(false);
      setHasError(true);
    };

    return () => {
      eventSource.removeEventListener("connected", handleConnected);
      eventSource.removeEventListener("notification", handleNotification);
      eventSource.removeEventListener("ping", handlePing);
      eventSource.close();
    };
  }, [normalizedWallet, onNotification]);

  return {
    isConnected: normalizedWallet ? isConnected : false,
    hasError: normalizedWallet ? hasError : false,
  };
}
