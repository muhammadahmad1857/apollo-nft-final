import type {
  ApiResponse,
  MarkAllReadData,
  MarkReadData,
  NotificationsListData,
  NotificationsQuery,
  UnreadCountData,
} from "@/types/notifications";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_NOTIFICATIONS_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

function normalizeWallet(wallet: string): string {
  return wallet.trim().toLowerCase();
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("Invalid JSON response from notifications API");
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Notifications API request failed");
  }

  return payload;
}

export function getNotificationsStreamUrl(wallet: string): string {
  return buildUrl("/notifications/stream", {
    wallet: normalizeWallet(wallet),
  });
}

export async function listNotifications({
  wallet,
  page = 1,
  pageSize = 20,
}: NotificationsQuery): Promise<NotificationsListData> {
  const response = await fetch(
    buildUrl("/notifications", {
      wallet: normalizeWallet(wallet),
      page,
      pageSize: Math.min(pageSize, 100),
    }),
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const payload = await parseResponse<NotificationsListData>(response);
  return payload.data;
}

export async function getUnreadCount(wallet: string): Promise<UnreadCountData> {
  const response = await fetch(
    buildUrl("/notifications/unread-count", {
      wallet: normalizeWallet(wallet),
    }),
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const payload = await parseResponse<UnreadCountData>(response);
  return payload.data;
}

export async function markNotificationRead(
  id: number,
  wallet: string
): Promise<MarkReadData> {
  const response = await fetch(
    buildUrl(`/notifications/${id}/read`, {
      wallet: normalizeWallet(wallet),
    }),
    {
      method: "PATCH",
    }
  );

  const payload = await parseResponse<MarkReadData>(response);
  return payload.data;
}

export async function markAllNotificationsRead(
  wallet: string
): Promise<MarkAllReadData> {
  const response = await fetch(
    buildUrl("/notifications/read-all", {
      wallet: normalizeWallet(wallet),
    }),
    {
      method: "PATCH",
    }
  );

  const payload = await parseResponse<MarkAllReadData>(response);
  return payload.data;
}
