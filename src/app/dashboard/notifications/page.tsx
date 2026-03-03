"use client";

import { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { BellOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { NotificationItemCard } from "@/components/notifications/NotificationItemCard";
import { NotificationSkeleton } from "@/components/notifications/NotificationSkeleton";
import { NotificationToolbar } from "@/components/notifications/NotificationToolbar";
import { Button } from "@/components/ui/button";
import {
  notificationKeys,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  useUnreadNotificationsCount,
} from "@/hooks/useNotifications";
import { useNotificationsStream } from "@/hooks/useNotificationsStream";

const PAGE_SIZE = 20;

export default function DashboardNotificationsPage() {
  const { address, isConnected } = useAccount();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const wallet = useMemo(() => address||"", [address]);

  const stream = useNotificationsStream({
    wallet,
    onNotification: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const shouldPoll = !stream.isConnected || stream.hasError;

  const notificationsQuery = useNotificationsList({
    wallet,
    page,
    pageSize: PAGE_SIZE,
    pollingEnabled: shouldPoll,
  });

  const unreadQuery = useUnreadNotificationsCount({
    wallet,
    pollingEnabled: shouldPoll,
  });

  const markReadMutation = useMarkNotificationRead(wallet);
  const markAllMutation = useMarkAllNotificationsRead(wallet);

  const handleMarkRead = async (notificationId: number) => {
    try {
      await markReadMutation.mutateAsync(notificationId);
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read"
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllMutation.mutateAsync();
      toast.success("Notifications marked as read", {
        description: `${result.updatedCount} updated`,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to mark all notifications"
      );
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-zinc-200">
            Connect your wallet to view notifications
          </p>
          <ConnectButton showBalance />
        </div>
      </div>
    );
  }

  const items = notificationsQuery.data?.items || [];
  const pagination = notificationsQuery.data?.pagination;
  const unreadCount = unreadQuery.data?.unread ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-zinc-400">
            Live account alerts from marketplace moderation and admin actions
          </p>
        </div>

        <Button
          variant="outline"
          className="border-zinc-700/50 bg-zinc-900/40 hover:bg-zinc-800/60"
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <NotificationToolbar
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        markingAll={markAllMutation.isPending}
      />

      {!stream.isConnected && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Realtime stream unavailable. Using polling fallback.
        </div>
      )}

      <div className="space-y-3">
        {notificationsQuery.isLoading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : notificationsQuery.isError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-red-200 text-sm">
            {notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : "Failed to load notifications"}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-10 text-center">
            <BellOff className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
            <p className="font-semibold text-zinc-200">No notifications yet</p>
            <p className="text-sm text-zinc-500 mt-1">
              You&apos;ll see admin and marketplace updates here.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <NotificationItemCard
              key={item.id}
              item={item}
              onMarkRead={handleMarkRead}
              isMarking={markReadMutation.isPending}
            />
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-3">
          <p className="text-xs text-zinc-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="border-zinc-700/50 bg-zinc-900/40 hover:bg-zinc-800/60"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="border-zinc-700/50 bg-zinc-900/40 hover:bg-zinc-800/60"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
