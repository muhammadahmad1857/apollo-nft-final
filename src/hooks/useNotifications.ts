import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationsApi";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (wallet: string, page: number, pageSize: number) =>
    [...notificationKeys.all, "list", wallet, page, pageSize] as const,
  unread: (wallet: string) =>
    [...notificationKeys.all, "unread", wallet] as const,
};

interface UseNotificationsListOptions {
  wallet?: string;
  page?: number;
  pageSize?: number;
  pollingEnabled?: boolean;
  pollingMs?: number;
}

export function useNotificationsList({
  wallet,
  page = 1,
  pageSize = 20,
  pollingEnabled = false,
  pollingMs = 20000,
}: UseNotificationsListOptions) {
  const normalizedWallet = wallet?.toLowerCase() || "";

  return useQuery({
    queryKey: notificationKeys.list(normalizedWallet, page, pageSize),
    enabled: Boolean(normalizedWallet),
    queryFn: () =>
      listNotifications({
        wallet: normalizedWallet,
        page,
        pageSize,
      }),
    refetchInterval: pollingEnabled ? pollingMs : false,
  });
}

interface UseUnreadCountOptions {
  wallet?: string;
  pollingEnabled?: boolean;
  pollingMs?: number;
}

export function useUnreadNotificationsCount({
  wallet,
  pollingEnabled = false,
  pollingMs = 20000,
}: UseUnreadCountOptions) {
  const normalizedWallet = wallet?.toLowerCase() || "";

  return useQuery({
    queryKey: notificationKeys.unread(normalizedWallet),
    enabled: Boolean(normalizedWallet),
    queryFn: () => getUnreadCount(normalizedWallet),
    refetchInterval: pollingEnabled ? pollingMs : false,
  });
}

export function useMarkNotificationRead(wallet?: string) {
  const queryClient = useQueryClient();
  const normalizedWallet = wallet?.toLowerCase() || "";

  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id, normalizedWallet),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });
}

export function useMarkAllNotificationsRead(wallet?: string) {
  const queryClient = useQueryClient();
  const normalizedWallet = wallet?.toLowerCase() || "";

  return useMutation({
    mutationFn: () => markAllNotificationsRead(normalizedWallet),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });
}
