import { formatDistanceToNow } from "date-fns";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNotificationTypeMeta } from "@/lib/notificationType";
import type { NotificationItem } from "@/types/notifications";

interface NotificationItemCardProps {
  item: NotificationItem;
  onMarkRead: (id: number) => void;
  isMarking: boolean;
}

function getMetadataSummary(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;

  const tokenId = metadata.tokenId;
  const nftId = metadata.nftId;
  const reason = metadata.reason;

  const segments: string[] = [];
  if (typeof tokenId === "number" || typeof tokenId === "string") {
    segments.push(`Token #${tokenId}`);
  }
  if (typeof nftId === "number" || typeof nftId === "string") {
    segments.push(`NFT #${nftId}`);
  }
  if (typeof reason === "string" && reason.trim()) {
    segments.push(reason.trim());
  }

  return segments.length > 0 ? segments.join(" • ") : null;
}

export function NotificationItemCard({
  item,
  onMarkRead,
  isMarking,
}: NotificationItemCardProps) {
  const { Icon, label } = getNotificationTypeMeta(item.type);
  const metadataSummary = getMetadataSummary(item.metadata);

  return (
    <div
      className={`rounded-xl border p-4 transition-all backdrop-blur-md ${
        item.isRead
          ? "border-zinc-800/50 bg-zinc-900/20"
          : "border-white/20 bg-zinc-800/40 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg border border-zinc-700/50 bg-zinc-800/50 flex items-center justify-center">
          <Icon className="h-4 w-4 text-zinc-200" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{item.title || label}</p>
            {!item.isRead && (
              <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-400/30">
                Unread
              </Badge>
            )}
          </div>

          <p className="text-sm text-zinc-300 wrap-break-word">{item.message}</p>

          {metadataSummary && (
            <p className="text-xs text-zinc-400 wrap-break-word">{metadataSummary}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-zinc-500">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>

            {!item.isRead && (
              <Button
                size="sm"
                variant="outline"
                disabled={isMarking}
                onClick={() => onMarkRead(item.id)}
                className="border-zinc-600/60 bg-zinc-900/30 hover:bg-zinc-800/50"
              >
                <Check className="h-3.5 w-3.5" />
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
