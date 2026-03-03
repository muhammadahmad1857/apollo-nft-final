import {
  Bell,
  Gavel,
  ShieldAlert,
  ShieldCheck,
  ShieldMinus,
  ShieldPlus,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/types/notifications";

export function getNotificationTypeMeta(type: NotificationType): {
  label: string;
  Icon: LucideIcon;
} {
  switch (type) {
    case "ADMIN_BLOCK_USER":
      return { label: "Account blocked", Icon: UserMinus };
    case "ADMIN_UNBLOCK_USER":
      return { label: "Account unblocked", Icon: UserPlus };
    case "ADMIN_CHANGE_ROLE":
      return { label: "Role updated", Icon: ShieldCheck };
    case "ADMIN_NFT_STATUS_CHANGED":
      return { label: "NFT status changed", Icon: ShieldAlert };
    case "ADMIN_NFT_DELISTED":
      return { label: "NFT delisted", Icon: ShieldMinus };
    case "ADMIN_AUCTION_FROZEN":
      return { label: "Auction frozen", Icon: Gavel };
    case "ADMIN_AUCTION_UNFROZEN":
      return { label: "Auction resumed", Icon: ShieldPlus };
    default:
      return { label: "Notification", Icon: Bell };
  }
}
