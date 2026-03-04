"use client";

import { BlockedUserNotice } from "@/components/blocked-user-notice";
import { useUser } from "@/hooks/useUser";
import { useAccount } from "wagmi";

type BlockedUserTopBannerProps = {
  message?: string;
  className?: string;
};

export function BlockedUserTopBanner({
  message = "Your account is temporarily blocked. Some actions may be unavailable. Contact us at hello@blaqclouds.io if this is a mistake.",
  className,
}: BlockedUserTopBannerProps) {
  const { address } = useAccount();
  const { data: user } = useUser(address || "");

  if (!user?.isBlocked) {
    return null;
  }

  return <BlockedUserNotice compact message={message} className={className} />;
}
