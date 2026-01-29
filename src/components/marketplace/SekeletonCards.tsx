import { Skeleton } from "@/components/ui/skeleton";

const SkeletonCard = () => (
  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-white dark:bg-zinc-900">
    <Skeleton className="aspect-square w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="h-10 w-full" />
  </div>
);

const SkeletonCards = ({ count = 8 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  );
};

export default SkeletonCards;