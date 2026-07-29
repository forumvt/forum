import { Skeleton } from "@/components/ui/skeleton";

export function ForumsListSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Main Content */}
      <div className="min-w-0 flex-1 space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            {/* Category Header Skeleton */}
            <div className="bg-muted rounded-lg p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="mt-2 h-4 w-full max-w-64" />
            </div>

            {/* Forums Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="border-border bg-card rounded-lg border p-4"
                >
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Skeleton */}
      <aside className="w-full shrink-0 lg:w-80">
        <Skeleton className="h-64 w-full rounded-lg" />
      </aside>
    </div>
  );
}
