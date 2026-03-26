export type NotificationType =
  | "ADMIN_BLOCK_USER"
  | "ADMIN_UNBLOCK_USER"
  | "ADMIN_CHANGE_ROLE"
  | "ADMIN_NFT_STATUS_CHANGED"
  | "ADMIN_NFT_DELISTED"
  | "ADMIN_AUCTION_FROZEN"
  | "ADMIN_AUCTION_UNFROZEN"
  | "PENDING_MINT_READY"
  | string;

export interface NotificationItem {
  id: number;
  recipientUserId: number;
  recipientWalletAddress: string;
  actorUserId: number | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface NotificationsListData {
  items: NotificationItem[];
  pagination: NotificationPagination;
}

export interface UnreadCountData {
  unread: number;
}

export interface MarkReadData {
  id: number;
  isRead: boolean;
  readAt: string | null;
  updatedAt: string;
}

export interface MarkAllReadData {
  updatedCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  data: T;
}

export interface NotificationsQuery {
  wallet: string;
  page?: number;
  pageSize?: number;
}
