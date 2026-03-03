import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationToolbarProps {
  unreadCount: number;
  onMarkAllRead: () => void;
  markingAll: boolean;
}

export function NotificationToolbar({
  unreadCount,
  onMarkAllRead,
  markingAll,
}: NotificationToolbarProps) {
  return (
    <div className="rounded-2xl border border-zinc-200/10 dark:border-zinc-800/40 bg-zinc-950/20 backdrop-blur-md p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-700/30 border border-zinc-600/40 flex items-center justify-center">
            <Bell className="h-5 w-5 text-zinc-200" />
          </div>
          <div>
            <p className="text-sm text-zinc-300">Unread notifications</p>
            <p className="text-xl font-bold text-white">{unreadCount}</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-white/10 text-white border border-white/20">
              New
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onMarkAllRead}
          disabled={markingAll || unreadCount === 0}
          className="border-zinc-600/50 bg-zinc-900/40 hover:bg-zinc-800/50"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </Button>
      </div>
    </div>
  );
}
