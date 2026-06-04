"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PendingNavigation = { type: "href"; href: string } | { type: "back" };

interface UploadLeaveGuardProps {
  active: boolean;
  children?: ReactNode;
}

export function UploadLeaveGuard({ active, children }: UploadLeaveGuardProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pendingNavRef = useRef<PendingNavigation | null>(null);
  const guardPushedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [active]);

  useEffect(() => {
    if (!active) {
      guardPushedRef.current = false;
      return;
    }

    if (!guardPushedRef.current) {
      history.pushState({ uploadLeaveGuard: true }, "", window.location.href);
      guardPushedRef.current = true;
    }

    const handlePopState = () => {
      history.pushState({ uploadLeaveGuard: true }, "", window.location.href);
      pendingNavRef.current = { type: "back" };
      setOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [active, pathname]);

  useEffect(() => {
    if (!active) return;

    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank" || anchor.download) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const nextPath = url.pathname + url.search + url.hash;
      const currentPath = pathname + window.location.search + window.location.hash;
      if (nextPath === currentPath) return;

      event.preventDefault();
      event.stopPropagation();
      pendingNavRef.current = { type: "href", href: nextPath };
      setOpen(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [active, pathname]);

  const handleStay = useCallback(() => {
    pendingNavRef.current = null;
    setOpen(false);
  }, []);

  const handleLeave = useCallback(() => {
    const pending = pendingNavRef.current;
    pendingNavRef.current = null;
    setOpen(false);
    guardPushedRef.current = false;

    if (!pending) return;

    if (pending.type === "back") {
      history.go(-2);
      return;
    }

    window.location.assign(pending.href);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) handleStay();
    },
    [handleStay]
  );

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Upload in progress</DialogTitle>
            <DialogDescription>
              Your file is still uploading to Cloudflare. Leaving now will pause the upload. You
              can resume by selecting the same file again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleStay}>
              Stay
            </Button>
            <Button type="button" variant="destructive" onClick={handleLeave}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
