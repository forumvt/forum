import { Skeleton } from "@/components/ui/skeleton";

export function ForumSkeleton() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div className="mb-6 text-center sm:mb-8">
          <Skeleton className="mx-auto h-8 w-32 sm:h-10" />
        </div>

        <div className="bg-muted rounded-lg p-4 shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 max-w-full" />
              <div className="mt-3 flex flex-row gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>

        <div className="border-border max-sm:border-t sm:space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-card p-3 max-sm:border-x-0 max-sm:border-t-0 sm:rounded-lg sm:border sm:p-6"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <Skeleton className="size-10 shrink-0 rounded-sm sm:size-12" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="mt-1 h-4 w-8 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
