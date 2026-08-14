'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ScrollPaginationProps {
  page: number
  totalPages: number
  onPage: (page: number) => void
}

/** Compact prev/next + page-number pagination for one section's scroll grid — Dialect B (CSS vars), matching the member library's own styling. */
export function ScrollPagination({ page, totalPages, onPage }: ScrollPaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)

  const pageBtn = (n: number, active: boolean) => (
    <button
      key={n}
      onClick={() => onPage(n)}
      aria-label={`Page ${n}`}
      aria-current={active ? 'page' : undefined}
      style={{
        minWidth: 22, height: 22, borderRadius: 5, border: '1px solid var(--border)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
        background: active ? 'var(--gold)' : 'transparent', color: active ? '#fff' : 'var(--text-secondary)',
      }}
    >
      {n}
    </button>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px', borderTop: '1px solid var(--border)' }}>
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
      >
        <ChevronLeft size={12} />
      </button>

      {pages.map((n, i) => (
        <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && pages[i - 1] !== n - 1 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>…</span>}
          {pageBtn(n, n === page)}
        </span>
      ))}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
      >
        <ChevronRight size={12} />
      </button>
    </div>
  )
}
