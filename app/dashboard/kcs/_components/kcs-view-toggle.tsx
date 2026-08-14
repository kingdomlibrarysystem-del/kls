'use client'

import { LayoutGrid, Table as TableIcon, List, BarChart3 } from 'lucide-react'

export type KcsContentView = 'cards' | 'table' | 'list'

interface KcsViewToggleProps {
  view: KcsContentView
  onViewChange: (view: KcsContentView) => void
  showAnalytics: boolean
  onToggleAnalytics: () => void
  /** Accessible label prefix for the toggle group, e.g. "scrolls" or "related resources". */
  label: string
}

const CONTENT_OPTIONS: { key: KcsContentView; icon: typeof LayoutGrid; label: string }[] = [
  { key: 'cards', icon: LayoutGrid, label: 'Cards' },
  { key: 'table', icon: TableIcon, label: 'Table' },
  { key: 'list', icon: List, label: 'List' },
]

/**
 * View-mode switcher shared by the KCS pillar page and scroll-detail page:
 * Cards/Table/List are mutually exclusive content views (same rows rendered
 * three ways), while Analytics is an independent toggle that can be shown
 * alongside any of the three — not a fourth mutually-exclusive tab, since a
 * reader may want the stat/chart overlay while still browsing Cards, Table,
 * or List. Matches the grid/list toggle pattern already used in
 * `app/member/library/page.tsx` (gold-tinted active state, lucide icons,
 * `aria-pressed`).
 */
export function KcsViewToggle({ view, onViewChange, showAnalytics, onToggleAnalytics, label }: KcsViewToggleProps) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 8px',
    background: active ? 'rgba(212,168,67,0.15)' : 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 6,
    cursor: 'pointer',
    color: active ? 'var(--gold)' : 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.15s',
  })

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`${label} view options`}>
      {CONTENT_OPTIONS.map(({ key, icon: Icon, label: optionLabel }) => (
        <button
          key={key}
          onClick={() => onViewChange(key)}
          aria-label={`${optionLabel} view`}
          aria-pressed={view === key}
          style={btnStyle(view === key)}
        >
          <Icon size={14} />
        </button>
      ))}
      <div className="divider" style={{ width: 1, height: 20, margin: '0 2px' }} />
      <button
        onClick={onToggleAnalytics}
        aria-label={showAnalytics ? 'Hide analytics' : 'Show analytics'}
        aria-pressed={showAnalytics}
        style={{ ...btnStyle(showAnalytics), gap: 5, padding: '6px 10px' }}
      >
        <BarChart3 size={14} /> <span style={{ fontSize: 11, fontWeight: 600 }}>Analytics</span>
      </button>
    </div>
  )
}
