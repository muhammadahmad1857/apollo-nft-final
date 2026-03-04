import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

type BlockedUserNoticeProps = {
  message: string;
  title?: string;
  compact?: boolean;
  showActions?: boolean;
  supportEmail?: string;
  onRefresh?: () => void;
  className?: string;
};

export function BlockedUserNotice({
  message,
  title = "Your account is temporarily blocked",
  compact = false,
  showActions = true,
  supportEmail = "hello@blaqclouds.io",
  onRefresh,
  className,
}: BlockedUserNoticeProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 w-full rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
          className
        )}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl backdrop-blur-lg rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center shadow-sm transition-all",
        className
      )}
    >
      {/* Icon */}
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-destructive">{title}</h2>

      {/* Message */}
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>

      {/* Actions */}
      {showActions && (
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={`mailto:${supportEmail}`}
            className="rounded-lg bg-destructive px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98]"
          >
            Contact Support
          </a>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted active:scale-[0.98]"
            >
              Refresh Status
            </button>
          )}
        </div>
      )}
    </div>
  );
}