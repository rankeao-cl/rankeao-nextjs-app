import { Card } from "@heroui/react/card";
import { Skeleton } from "@heroui/react/skeleton";


export default function MarketplaceSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="surface-card rounded-2xl overflow-hidden">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="rounded-lg h-4 w-3/4" />
            <Skeleton className="rounded-lg h-5 w-20" />
            <div className="flex gap-1">
              <Skeleton className="rounded-full h-5 w-14" />
              <Skeleton className="rounded-full h-5 w-10" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="rounded-full w-5 h-5" />
              <Skeleton className="rounded-lg h-3 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="rounded-lg h-8 flex-1" />
              <Skeleton className="rounded-lg h-8 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
