import { Skeleton } from "@/components/ui/skeleton"

export function SettingsSkeleton() {
  return (
    <>
      <div>
        <Skeleton className="mb-2 h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-96" />
      </div>

      <div className="border-border bg-card rounded-lg border p-6">
        <Skeleton className="mb-4 h-7 w-24" />
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      <div className="border-border bg-card rounded-lg border p-6">
        <Skeleton className="mb-4 h-7 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="ml-auto h-9 w-40" />
        </div>
      </div>

      <div className="border-border bg-card rounded-lg border p-6">
        <Skeleton className="mb-4 h-7 w-24" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-60" />
        </div>
      </div>
    </>
  )
}
