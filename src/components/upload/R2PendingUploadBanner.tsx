"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/formatBytes";
import {
  discardR2PendingUpload,
  listPendingR2UploadSessions,
  type R2PendingUploadSession,
} from "@/lib/r2/mediaUpload";

interface R2PendingUploadBannerProps {
  kind?: "video" | "trailer";
  onResumeClick?: () => void;
  refreshKey?: number;
}

export function R2PendingUploadBanner({
  kind,
  onResumeClick,
  refreshKey = 0,
}: R2PendingUploadBannerProps) {
  const [pending, setPending] = useState<R2PendingUploadSession[]>([]);
  const [discardingKey, setDiscardingKey] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPending(listPendingR2UploadSessions(kind));
  }, [kind]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  useEffect(() => {
    const handleFocus = () => refresh();
    const handleStorage = () => refresh();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  if (pending.length === 0) return null;

  const kindLabel = (sessionKind: R2PendingUploadSession["kind"]) =>
    sessionKind === "trailer" ? "trailer" : "video";

  return (
    <div className="space-y-2">
      {pending.map((session) => (
        <div
          key={session.storageKey}
          className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-zinc-100">
                Incomplete Cloudflare {kindLabel(session.kind)} upload
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">{session.filename}</span> (
                {formatBytes(session.fileSize)}) — {session.percent}% uploaded. Select the same
                file to continue.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {onResumeClick && (
              <Button type="button" size="sm" variant="secondary" onClick={onResumeClick}>
                Select file
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={discardingKey === session.storageKey}
              onClick={async () => {
                setDiscardingKey(session.storageKey);
                try {
                  await discardR2PendingUpload(session.storageKey);
                  refresh();
                  toast.success("Incomplete upload discarded");
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Failed to discard upload"
                  );
                } finally {
                  setDiscardingKey(null);
                }
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Discard</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
