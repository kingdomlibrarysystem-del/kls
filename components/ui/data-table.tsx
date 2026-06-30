'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Download } from 'lucide-react'

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
  if (!active) return <ChevronUp size={12} className="text-w-400 dark:text-white/30" />
  return dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
}

function PaginationBar({
  page, totalPages, onPage,
}: { page: number; totalPages: number; onPage: (n: number) => void }) {
  const btnBase = 'border border-w-300 dark:border-white/10 rounded font-lato text-xs text-w-700 dark:text-white/60 hover:bg-w-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'

  const pills = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
    .reduce<(number | '…')[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…')
      acc.push(n)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="font-lato text-xs text-w-700 dark:text-white/60">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button className={`${btnBase} px-2 py-1.5`} disabled={page === 1} onClick={() => onPage(1)}>First</button>
        <button className={`${btnBase} p-1.5`} disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={14} />
        </button>

        {pills.map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="px-1.5 font-lato text-xs text-w-600 dark:text-white/40">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              className={`px-2.5 py-1 rounded text-xs font-lato border transition-colors ${
                page === n
                  ? 'bg-w-600 text-white border-w-600'
                  : 'border-w-300 dark:border-white/10 text-w-700 dark:text-white/60 hover:bg-w-100 dark:hover:bg-white/10'
              }`}
            >
              {n}
            </button>
          )
        )}

        <button className={`${btnBase} p-1.5`} disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight size={14} />
        </button>
        <button className={`${btnBase} px-2 py-1.5`} disabled={page === totalPages} onClick={() => onPage(totalPages)}>Last</button>
      </div>
    </div>
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

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-form-highlight dark:bg-white/5 border border-w-300 dark:border-white/10 rounded-lg p-3 mb-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1 items-center">
          {/* Search */}
          {searchFilter && (
            <div className="relative min-w-[220px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-600 dark:text-white/40" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-8 pr-4 py-2 font-lato text-sm border border-w-400 dark:border-white/10 bg-white dark:bg-white/5 text-w-950 dark:text-white placeholder:text-w-500 dark:placeholder:text-white/30 rounded focus:border-w-600 focus:outline-none"
              />
            </div>
          )}

          {/* Extra filters slot */}
          {filters}

          {/* Page size */}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="px-3 py-2 font-lato text-sm border border-w-400 dark:border-white/10 bg-white dark:bg-white/5 text-w-950 dark:text-white rounded focus:border-w-600 focus:outline-none"
          >
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </div>

        {/* Export */}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-w-400 dark:border-white/10 bg-white dark:bg-white/5 rounded font-lato text-sm text-w-700 dark:text-white/60 hover:bg-w-100 dark:hover:bg-white/10 transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="font-lato text-xs text-w-700 dark:text-white/50 mb-2">
        {caption ?? `Showing ${paged.length} of ${filtered.length} record${filtered.length !== 1 ? 's' : ''}${filtered.length !== data.length ? ` (filtered from ${data.length})` : ''}`}
      </p>

      {/* Table */}
      <div className="bg-white dark:bg-white/5 border border-w-300 dark:border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-form-section dark:bg-white/10 border-b border-w-300 dark:border-white/10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    className={`px-4 py-3 text-left font-lato text-xs font-semibold text-w-700 dark:text-white/70 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-w-950 dark:hover:text-white transition-colors' : ''} ${col.className ?? ''}`}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIndicator active={sortKey === col.key} dir={sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-w-200 dark:divide-white/10">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center font-lato text-sm text-w-700 dark:text-white/50">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-form-highlight dark:hover:bg-white/5 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 font-lato text-sm text-w-950 dark:text-white/80 ${col.className ?? ''}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && <PaginationBar page={page} totalPages={totalPages} onPage={goPage} />}
    </div>
  )
}
