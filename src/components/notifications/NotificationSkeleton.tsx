import { Skeleton } from "@/components/ui/skeleton";

export function NotificationSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200/10 dark:border-zinc-800/40 bg-zinc-900/20 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}
