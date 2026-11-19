import { Loader2 } from 'lucide-react'

/**
 * The reader's own loading screen (route loading.tsx): appears the moment
 * "Read" is clicked, shaped like the reader (toolbar + a page), so the member
 * sees the book opening instead of a frozen page.
 */
export function ReaderLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-4" role="status" aria-label="Opening the book">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="card flex flex-col items-center justify-center gap-3" style={{ minHeight: 520 }}>
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-foreground">Opening the book…</p>
        <p className="text-xs text-muted-foreground">The first page will appear in a moment.</p>
      </div>
    </div>
  )
}
