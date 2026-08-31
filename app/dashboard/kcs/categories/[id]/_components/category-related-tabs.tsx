'use client'

import { Package, BarChart3, BookOpen, Bookmark, Users, Wallet, GraduationCap } from 'lucide-react'

export type CategoryRelatedTab = 'resources' | 'analytics' | 'borrowings' | 'reservations' | 'members' | 'finance' | 'courses'

interface CategoryRelatedTabsProps {
  active: CategoryRelatedTab
  counts: Record<CategoryRelatedTab, number>
  onChange: (tab: CategoryRelatedTab) => void
}

const TABS: { id: CategoryRelatedTab; label: string; icon: typeof Package }[] = [
  { id: 'resources', label: 'Resources', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'borrowings', label: 'Borrowings', icon: BookOpen },
  { id: 'reservations', label: 'Reservations', icon: Bookmark },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
]

/** Switches the category detail page's related-data area between its 7 sections, matching ManageCategoriesTabs' style. */
export function CategoryRelatedTabs({ active, counts, onChange }: CategoryRelatedTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="Category related data">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = id === active
        const count = counts[id]
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
              padding: '7px 12px',
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
            {count > 0 && (
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
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
