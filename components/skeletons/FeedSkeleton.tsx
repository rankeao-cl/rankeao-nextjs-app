import { Card, Skeleton } from "@heroui/react";

export default function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="surface-card rounded-2xl overflow-hidden">
          <Card.Content className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="rounded-full w-8 h-8" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="rounded-lg h-3 w-24" />
                <Skeleton className="rounded-lg h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="rounded-lg h-4 w-full" />
            <Skeleton className="rounded-lg h-4 w-3/4" />
            <Skeleton className="rounded-2xl h-48 w-full" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="rounded-lg h-8 w-16" />
              <Skeleton className="rounded-lg h-8 w-16" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
