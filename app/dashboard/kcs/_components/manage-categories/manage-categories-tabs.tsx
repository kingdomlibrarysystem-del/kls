'use client'

import { BookMarked, FileStack } from 'lucide-react'

export type ManageCategoriesTab = 'root' | 'sub'

interface ManageCategoriesTabsProps {
  active: ManageCategoriesTab
  rootCount: number
  subCount: number
  onChange: (tab: ManageCategoriesTab) => void
}

const TABS: { id: ManageCategoriesTab; label: string; icon: typeof BookMarked }[] = [
  { id: 'root', label: 'Root Categories', icon: BookMarked },
  { id: 'sub', label: 'Subcategories', icon: FileStack },
]

/** Switches Manage Categories between root-pillar and subcategory (scroll) management, matching KcsPillarTabs' style. */
export function ManageCategoriesTabs({ active, rootCount, subCount, onChange }: ManageCategoriesTabsProps) {
  const counts: Record<ManageCategoriesTab, number> = { root: rootCount, sub: subCount }

  return (
    <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="Manage Categories sections">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = id === active
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className="flex items-center gap-1.5"
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: 6,
              border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
              background: isActive ? 'var(--gold)' : 'var(--bg-card)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={13} />
            {label}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-section)',
                color: isActive ? '#fff' : 'var(--text-muted)',
              }}
            >
              {counts[id]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
