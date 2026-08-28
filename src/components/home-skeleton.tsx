import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
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

      <aside className="w-full shrink-0 lg:w-80">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </aside>
    </div>
  );
}
