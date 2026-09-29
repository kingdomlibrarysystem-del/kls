import { Skeleton } from '@/components/ui/skeleton'

/**
 * Route-level loading UI (used by app/dashboard/loading.tsx and
 * app/member/loading.tsx). Shown instantly on navigation while a server
 * page loads its data, so moving between pages never looks frozen.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-5 p-1" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 rounded-md" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
