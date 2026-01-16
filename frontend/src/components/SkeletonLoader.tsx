import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48 flex-1" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function CodeBlockSkeleton() {
  return (
    <div className="rounded-lg bg-code p-4">
      <Skeleton className="h-4 w-3/4 mb-2 bg-muted/50" />
      <Skeleton className="h-4 w-1/2 mb-2 bg-muted/50" />
      <Skeleton className="h-4 w-2/3 mb-2 bg-muted/50" />
      <Skeleton className="h-4 w-1/3 bg-muted/50" />
    </div>
  );
}
