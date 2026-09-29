'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  className?: string
  render: (row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  searchPlaceholder?: string
  searchFilter?: (row: T, query: string) => boolean
  filters?: React.ReactNode
  pageSizeOptions?: number[]
  defaultPageSize?: number
  emptyMessage?: string
  onExport?: () => void
  caption?: string
}

type SortDir = 'asc' | 'desc'

const PAGE_SIZE_DEFAULTS = [10, 25, 50, 100]

// ── Sub-components ────────────────────────────────────────────────────────────

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp size={12} className="text-muted-foreground/50" />
  return dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
}

function PaginationBar({
  page, totalPages, onPage,
}: { page: number; totalPages: number; onPage: (n: number) => void }) {
  const pills = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
    .reduce<(number | '…')[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…')
      acc.push(n)
      return acc
    }, [])

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
      <p className="font-lato text-xs text-muted-foreground">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="font-lato text-xs" disabled={page === 1} onClick={() => onPage(1)}>First</Button>
        <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={14} />
        </Button>

        {pills.map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="px-1.5 font-lato text-xs text-muted-foreground">…</span>
          ) : (
            <Button
              key={n}
              variant={page === n ? 'default' : 'outline'}
              size="icon-sm"
              aria-current={page === n ? 'page' : undefined}
              onClick={() => onPage(n as number)}
              className="font-lato text-xs"
            >
              {n}
            </Button>
          )
        )}

        <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight size={14} />
        </Button>
        <Button variant="outline" size="sm" className="font-lato text-xs" disabled={page === totalPages} onClick={() => onPage(totalPages)}>Last</Button>
      </div>
    </div>
  )
}

/** Right/left edge fade shown over a horizontally-scrollable table, so overflow reads as an intentional affordance rather than a silent, unlabeled cutoff. */
function ScrollEdgeFade({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-0 bottom-0 w-8 z-10 from-foreground/10 to-transparent',
        side === 'left' ? 'left-0 bg-linear-to-r' : 'right-0 bg-linear-to-l'
      )}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = 'Search...',
  searchFilter,
  filters,
  pageSizeOptions = PAGE_SIZE_DEFAULTS,
  defaultPageSize = 10,
  emptyMessage = 'No records found.',
  onExport,
  caption,
}: DataTableProps<T>) {
  const [search,   setSearch]   = useState('')
  const [sortKey,  setSortKey]  = useState<string | null>(null)
  const [sortDir,  setSortDir]  = useState<SortDir>('asc')
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false })

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollState({
      canScrollLeft: el.scrollLeft > 0,
      canScrollRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    })
  }, [])

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
      else { setSortDir('asc') }
      return key
    })
    setPage(1)
  }, [])

  const filtered = useMemo(() => {
    let rows = data
    if (search.trim() && searchFilter) {
      const q = search.toLowerCase()
      rows = rows.filter((r) => searchFilter(r, q))
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortKey] ?? '')
        const bv = String((b as Record<string, unknown>)[sortKey] ?? '')
        const cmp = av.localeCompare(bv)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [data, search, searchFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize)

  const goPage = (n: number) => setPage(Math.min(Math.max(1, n), totalPages))

  // Recompute scroll-fade affordance whenever the visible rows or viewport size
  // change. Depends on paged.length, not `paged` itself — `paged` is a fresh
  // array from filtered.slice() on every render, so using it directly here
  // reran this effect every render (setScrollState -> re-render -> new
  // `paged` reference -> effect reruns again), an infinite update loop.
  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    const onResize = () => updateScrollState()
    window.addEventListener('resize', onResize)
    const observer = new ResizeObserver(onResize)
    observer.observe(el)
    return () => {
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [paged.length, updateScrollState])

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-3 mb-3 flex flex-wrap gap-3 items-center justify-between shadow-xs">
        <div className="flex flex-wrap gap-3 flex-1 items-center">
          {/* Search */}
          {searchFilter && (
            <div className="relative min-w-[220px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="h-9 pl-8 pr-4 font-lato text-sm bg-background"
              />
            </div>
          )}

          {/* Extra filters slot */}
          {filters}

          {/* Page size — native select kept so it stays keyboard/mobile friendly */}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="h-9 px-3 font-lato text-sm border border-input bg-background text-foreground rounded-lg outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </div>

        {/* Export */}
        {onExport && (
          <Button variant="outline" onClick={onExport} className="h-9 px-3 font-lato">
            <Download size={13} /> Export CSV
          </Button>
        )}
      </div>

      {/* Result count */}
      <p className="font-lato text-xs text-muted-foreground mb-2">
        {caption ?? `Showing ${paged.length} of ${filtered.length} record${filtered.length !== 1 ? 's' : ''}${filtered.length !== data.length ? ` (filtered from ${data.length})` : ''}`}
      </p>

      {/* Table — plain <table> inside our own scroll container (not shadcn's
          <Table>, which adds a second overflow wrapper and would break the
          scroll-edge fade measurement), with shadcn row/cell primitives. */}
      <div className="relative bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-xs">
        {scrollState.canScrollLeft && <ScrollEdgeFade side="left" />}
        {scrollState.canScrollRight && <ScrollEdgeFade side="right" />}
        <div ref={scrollRef} onScroll={updateScrollState} className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    className={cn(
                      'h-11 px-4 text-left font-lato text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-normal',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      col.className
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIndicator active={sortKey === col.key} dir={sortDir} />}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="px-4 py-12 text-center font-lato text-sm text-muted-foreground whitespace-normal">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((row) => (
                  <TableRow key={rowKey(row)} className="hover:bg-accent/60">
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn('px-4 py-3 font-lato text-sm text-foreground whitespace-normal', col.className)}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} onPage={goPage} />}
    </div>
  )
}
