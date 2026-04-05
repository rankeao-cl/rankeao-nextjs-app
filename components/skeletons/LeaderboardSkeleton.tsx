import { Skeleton } from "@heroui/react/skeleton";


export default function LeaderboardSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="surface-panel border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-[var(--surface-secondary)] border-b border-[var(--border)]">
        <Skeleton className="rounded-lg h-3 w-8" />
        <Skeleton className="rounded-lg h-3 w-20" />
        <Skeleton className="rounded-lg h-3 w-12" />
        <Skeleton className="rounded-lg h-3 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-4 border-b border-[var(--border)] last:border-b-0"
        >
          <Skeleton className="rounded-lg h-4 w-6" />
          <Skeleton className="rounded-full w-8 h-8" />
          <Skeleton className="rounded-lg h-4 w-24" />
          <Skeleton className="rounded-lg h-4 w-12 ml-auto" />
        </div>
      ))}
    </div>
  );
}
